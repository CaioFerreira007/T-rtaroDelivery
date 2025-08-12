using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TartaroAPI.Data;
using TartaroAPI.DTO;
using TartaroAPI.DTOs;
using TartaroAPI.Models;

namespace TartaroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProdutosController : ControllerBase
    {
        private readonly TartaroDbContext _context;

        public ProdutosController(TartaroDbContext context) => _context = context;

        // Helper para salvar imagem
        private async Task<string?> SalvarImagem(IFormFile img)
        {
            var ext = Path.GetExtension(img.FileName).ToLower();
            var permit = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            if (!permit.Contains(ext)) return null;

            var pasta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "imagens");
            if (!Directory.Exists(pasta)) Directory.CreateDirectory(pasta);

            var nome = Guid.NewGuid() + ext;
            var path = Path.Combine(pasta, nome);
            using var fs = new FileStream(path, FileMode.Create);
            await img.CopyToAsync(fs);

            return $"{Request.Scheme}://{Request.Host}/imagens/{nome}";
        }

        // 📄 GET com paginação
        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int pageSize = 10)
        {
            var list = await _context.Produtos
                .Include(p => p.Imagens)
                .OrderBy(p => p.Nome)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var dto = list.Select(p => new ProdutoReadDTO
            {
                Id = p.Id,
                Tipo = p.Tipo,
                Nome = p.Nome,
                Descricao = p.Descricao ?? string.Empty,
                Categoria = p.Categoria,
                Preco = p.Preco,
                ImagemUrls = p.Imagens.Select(i => i.Url).ToList()
            });

            return Ok(dto);
        }

        // 🔍 GET por ID
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var p = await _context.Produtos
                .Include(x => x.Imagens)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (p == null)
                return NotFound(new { message = "Produto não encontrado." });

            return Ok(new ProdutoReadDTO
            {
                Id = p.Id,
                Tipo = p.Tipo,
                Nome = p.Nome,
                Descricao = p.Descricao ?? string.Empty,
                Categoria = p.Categoria,
                Preco = p.Preco,
                ImagemUrls = p.Imagens.Select(i => i.Url).ToList()
            });
        }

        // ➕ CREATE
        [HttpPost]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> Create(
            [FromForm] ProdutoCreateUpdateDTO dto,
            [FromForm] List<IFormFile> imagens)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (await _context.Produtos.AnyAsync(p => p.Nome == dto.Nome))
                return BadRequest(new { message = "Já existe um produto com esse nome." });

            var p = new Produto
            {
                Tipo = dto.Tipo,
                Nome = dto.Nome,
                Descricao = dto.Descricao ?? string.Empty,
                Categoria = dto.Categoria,
                Preco = dto.Preco
            };

            _context.Produtos.Add(p);
            await _context.SaveChangesAsync();

            if (imagens?.Any() == true)
            {
                foreach (var img in imagens)
                {
                    var url = await SalvarImagem(img);
                    if (url != null)
                        _context.ProductImages.Add(new ProdutoImage { Url = url, ProdutoId = p.Id });
                }
                await _context.SaveChangesAsync();
            }

            var readDto = new ProdutoReadDTO
            {
                Id = p.Id,
                Tipo = p.Tipo,
                Nome = p.Nome,
                Descricao = p.Descricao,
                Categoria = p.Categoria,
                Preco = p.Preco,
                ImagemUrls = await _context.ProductImages
                    .Where(i => i.ProdutoId == p.Id)
                    .Select(i => i.Url)
                    .ToListAsync()
            };

            return CreatedAtAction(nameof(GetById), new { id = p.Id }, readDto);
        }

        // ✏️ UPDATE
        [HttpPut("{id:int}")]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> Update(
            int id,
            [FromForm] ProdutoCreateUpdateDTO dto,
            [FromForm] List<IFormFile> imagens)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existing = await _context.Produtos
                .Include(x => x.Imagens)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (existing == null)
                return NotFound(new { message = "Produto não encontrado." });

            if (existing.Nome != dto.Nome &&
                await _context.Produtos.AnyAsync(x => x.Nome == dto.Nome))
            {
                return BadRequest(new { message = "Já existe outro produto com esse nome." });
            }

            existing.Tipo = dto.Tipo;
            existing.Nome = dto.Nome;
            existing.Descricao = dto.Descricao ?? string.Empty;
            existing.Categoria = dto.Categoria;
            existing.Preco = dto.Preco;

            // remove imagens antigas
            foreach (var img in existing.Imagens)
            {
                var file = Path.GetFileName(img.Url);
                var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "imagens", file);
                if (System.IO.File.Exists(path))
                    System.IO.File.Delete(path);
            }
            _context.ProductImages.RemoveRange(existing.Imagens);

            // salva novas
            if (imagens?.Any() == true)
            {
                foreach (var img in imagens)
                {
                    var url = await SalvarImagem(img);
                    if (url != null)
                        _context.ProductImages.Add(new ProdutoImage { Url = url, ProdutoId = existing.Id });
                }
            }

            await _context.SaveChangesAsync();

            var readDto = new ProdutoReadDTO
            {
                Id = existing.Id,
                Tipo = existing.Tipo,
                Nome = existing.Nome,
                Descricao = existing.Descricao,
                Categoria = existing.Categoria,
                Preco = existing.Preco,
                ImagemUrls = await _context.ProductImages
                    .Where(i => i.ProdutoId == existing.Id)
                    .Select(i => i.Url)
                    .ToListAsync()
            };

            return Ok(readDto);
        }

        // 🗑️ DELETE
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> Delete(int id)
        {
            var p = await _context.Produtos
                .Include(x => x.Imagens)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (p == null)
                return NotFound(new { message = "Produto não encontrado." });

            // apaga arquivos
            foreach (var img in p.Imagens)
            {
                var file = Path.GetFileName(img.Url);
                var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "imagens", file);
                if (System.IO.File.Exists(path))
                    System.IO.File.Delete(path);
            }

            _context.ProductImages.RemoveRange(p.Imagens);
            _context.Produtos.Remove(p);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Produto e imagens removidos com sucesso." });
        }
    }
}
