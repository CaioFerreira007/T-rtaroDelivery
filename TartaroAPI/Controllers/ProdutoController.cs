using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TartaroAPI.Data;
using TartaroAPI.DTOs;
using TartaroAPI.Models;
using TartaroAPI.Services;

namespace TartaroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProdutosController : ControllerBase
    {
        private readonly TartaroDbContext _context;
        private readonly IFileStorageService _storageService;
        private const string DiretorioImagens = "imagens";

        public ProdutosController(TartaroDbContext context, IFileStorageService storageService)
        {
            _context = context;
            _storageService = storageService;
        }

        //  GET com paginação 
        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int pageSize = 10)
        {
            var produtosDto = await _context.Produtos
                .AsNoTracking()
                .OrderBy(p => p.Nome)
                .Select(p => new ProdutoReadDTO
                {
                    Id = p.Id,
                    Nome = p.Nome,
                    Descricao = p.Descricao,
                    Categoria = p.Categoria,
                    Preco = p.Preco,
                    ImagemUrls = p.Imagens.Select(img => img.Url).ToList()
                })
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(produtosDto);
        }

        //  GET por ID
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var produtoDto = await _context.Produtos
                .AsNoTracking()
                .Where(p => p.Id == id)
                .Select(p => new ProdutoReadDTO
                {
                    Id = p.Id,
                    Nome = p.Nome,
                    Descricao = p.Descricao,
                    Categoria = p.Categoria,
                    Preco = p.Preco,
                    ImagemUrls = p.Imagens.Select(img => img.Url).ToList()
                })
                .FirstOrDefaultAsync();

            if (produtoDto == null)
            {
                return NotFound(new { message = "Produto não encontrado." });
            }

            return Ok(produtoDto);
        }

        //  CREATE
        [HttpPost]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> Create([FromForm] ProdutoCreateUpdateDTO dto, [FromForm] List<IFormFile> imagens)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

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
                    var url = await _storageService.SalvarArquivoAsync(img, DiretorioImagens);
                    _context.ProductImages.Add(new ProdutoImage { Url = url, ProdutoId = p.Id });
                }
                await _context.SaveChangesAsync();
            }

            // Busca o DTO completo para retornar o objeto criado
            var actionResult = await GetById(p.Id);
            if (actionResult is OkObjectResult okResult)
            {
                return CreatedAtAction(nameof(GetById), new { id = p.Id }, okResult.Value);
            }

            return BadRequest("Não foi possível criar o produto.");
        }

        //  UPDATE 
        [HttpPut("{id:int}")]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> Update(int id, [FromForm] ProdutoCreateUpdateDTO dto, [FromForm] List<IFormFile> imagens)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existing = await _context.Produtos.Include(x => x.Imagens).FirstOrDefaultAsync(x => x.Id == id);
            if (existing == null) return NotFound("Produto não encontrado.");

            existing.Tipo = dto.Tipo;
            existing.Nome = dto.Nome;
            existing.Descricao = dto.Descricao ?? string.Empty;
            existing.Categoria = dto.Categoria;
            existing.Preco = dto.Preco;

            if (imagens?.Any() == true)
            {
                foreach (var img in existing.Imagens)
                {
                    _storageService.ApagarArquivo(img.Url, DiretorioImagens);
                }
                _context.ProductImages.RemoveRange(existing.Imagens);

                foreach (var img in imagens)
                {
                    var url = await _storageService.SalvarArquivoAsync(img, DiretorioImagens);
                    _context.ProductImages.Add(new ProdutoImage { Url = url, ProdutoId = existing.Id });
                }
            }

            await _context.SaveChangesAsync();

            var actionResult = await GetById(existing.Id);
            if (actionResult is OkObjectResult okResult)
            {
                return Ok(okResult.Value);
            }

            return NotFound("Não foi possível encontrar o produto após a atualização.");
        }

        //  DELETE 
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> Delete(int id)
        {
            var p = await _context.Produtos.Include(x => x.Imagens).FirstOrDefaultAsync(x => x.Id == id);
            if (p == null) return NotFound("Produto não encontrado.");

            foreach (var img in p.Imagens)
            {
                _storageService.ApagarArquivo(img.Url, DiretorioImagens);
            }

            _context.Produtos.Remove(p);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Produto e imagens removidos com sucesso." });
        }
    }
}