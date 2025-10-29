using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TartaroAPI.Data;
using TartaroAPI.DTOs;
using TartaroAPI.Models;
using TartaroAPI.Services;
using System.Globalization;

namespace TartaroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProdutosController : ControllerBase
    {
        private readonly TartaroDbContext _context;
        private readonly IFileStorageService _storageService;
        private readonly ILogger<ProdutosController> _logger;
        private const string DiretorioImagens = "imagens";

        public ProdutosController(
            TartaroDbContext context, 
            IFileStorageService storageService,
            ILogger<ProdutosController> logger)
        {
            _context = context;
            _storageService = storageService;
            _logger = logger;
        }

        [HttpGet("categorias")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategorias()
        {
            var categorias = await _context.Produtos
                .Select(p => p.Categoria)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Ok(categorias);
        }

        //  GET com paginação 
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll(int page = 1, int pageSize = 100)
        {
            var produtosDto = await _context.Produtos
                .AsNoTracking()
                .OrderByDescending(p => p.Preco) 
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
        [AllowAnonymous]
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
            try
            {
                _logger.LogInformation("=== CRIANDO NOVO PRODUTO ===");
                _logger.LogInformation("Nome: {Nome}, Categoria: {Categoria}, Preço (string): {Preco}", 
                    dto.Nome, dto.Categoria, dto.Preco);

                if (!ModelState.IsValid) return BadRequest(ModelState);

                if (!decimal.TryParse(dto.Preco, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal preco))
                {
                    _logger.LogWarning("Preço inválido recebido: {Preco}", dto.Preco);
                    return BadRequest(new { message = "Preço inválido. Use ponto (.) para separar decimais. Exemplo: 35.50" });
                }

                if (preco <= 0)
                {
                    return BadRequest(new { message = "Preço deve ser maior que zero." });
                }

                _logger.LogInformation(" Preço convertido com sucesso: {Preco}", preco);

                if (await _context.Produtos.AnyAsync(p => p.Nome == dto.Nome))
                    return BadRequest(new { message = "Já existe um produto com esse nome." });

                var p = new Produto
                {
                    Tipo = dto.Tipo,
                    Nome = dto.Nome,
                    Descricao = dto.Descricao ?? string.Empty,
                    Categoria = dto.Categoria,
                    Preco = preco 
                };

                _context.Produtos.Add(p);
                await _context.SaveChangesAsync();

                _logger.LogInformation(" Produto criado com ID: {Id}, Preço: {Preco}", p.Id, p.Preco);

                if (imagens?.Any() == true)
                {
                    _logger.LogInformation(" Salvando {Count} imagens...", imagens.Count);
                    foreach (var img in imagens)
                    {
                        var url = await _storageService.SalvarArquivoAsync(img, DiretorioImagens);
                        _context.ProductImages.Add(new ProdutoImage { Url = url, ProdutoId = p.Id });
                    }
                    await _context.SaveChangesAsync();
                    _logger.LogInformation(" Imagens salvas com sucesso");
                }

                var actionResult = await GetById(p.Id);
                if (actionResult is OkObjectResult okResult)
                {
                    return CreatedAtAction(nameof(GetById), new { id = p.Id }, okResult.Value);
                }

                return BadRequest(new { message = "Não foi possível criar o produto." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao criar produto");
                return StatusCode(500, new { message = "Erro interno do servidor.", error = ex.Message });
            }
        }

        //  UPDATE (FormData - com imagens)
        [HttpPut("{id:int}")]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> Update(int id, [FromForm] ProdutoCreateUpdateDTO dto, [FromForm] List<IFormFile> imagens)
        {
            try
            {
                _logger.LogInformation("=== ATUALIZANDO PRODUTO ID: {Id} (FormData) ===", id);
                _logger.LogInformation("Preço recebido (string): {Preco}", dto.Preco);

                if (!ModelState.IsValid) return BadRequest(ModelState);

                if (!decimal.TryParse(dto.Preco, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal preco))
                {
                    _logger.LogWarning("Preço inválido recebido: {Preco}", dto.Preco);
                    return BadRequest(new { message = "Preço inválido. Use ponto (.) para separar decimais. Exemplo: 35.50" });
                }

                if (preco <= 0)
                {
                    return BadRequest(new { message = "Preço deve ser maior que zero." });
                }

                _logger.LogInformation(" Preço convertido com sucesso: {Preco}", preco);

                var existing = await _context.Produtos.Include(x => x.Imagens).FirstOrDefaultAsync(x => x.Id == id);
                if (existing == null) return NotFound(new { message = "Produto não encontrado." });

                existing.Tipo = dto.Tipo;
                existing.Nome = dto.Nome;
                existing.Descricao = dto.Descricao ?? string.Empty;
                existing.Categoria = dto.Categoria;
                existing.Preco = preco; 

                _logger.LogInformation("Produto atualizado - Preço: {Preco}", existing.Preco);

                if (imagens?.Any() == true)
                {
                    _logger.LogInformation("📸 Substituindo imagens...");
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
                _logger.LogInformation(" Produto atualizado com sucesso");

                var actionResult = await GetById(existing.Id);
                if (actionResult is OkObjectResult okResult)
                {
                    return Ok(okResult.Value);
                }

                return NotFound(new { message = "Não foi possível encontrar o produto após a atualização." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao atualizar produto ID: {Id}", id);
                return StatusCode(500, new { message = "Erro interno do servidor.", error = ex.Message });
            }
        }

        // UPDATE DADOS APENAS (JSON - sem imagens)
        [HttpPatch("{id:int}")]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> UpdateDados(int id, [FromBody] ProdutoCreateUpdateDTO dto)
        {
            try
            {
                _logger.LogInformation("=== ATUALIZANDO DADOS DO PRODUTO ID: {Id} (JSON) ===", id);
                _logger.LogInformation("Dados recebidos: {@DTO}", dto);

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("ModelState inválido: {@Errors}", ModelState);
                    return BadRequest(ModelState);
                }

                if (!decimal.TryParse(dto.Preco, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal preco))
                {
                    _logger.LogWarning("Preço inválido recebido: {Preco}", dto.Preco);
                    return BadRequest(new { message = "Preço inválido. Use ponto (.) para separar decimais." });
                }

                if (preco <= 0)
                {
                    return BadRequest(new { message = "Preço deve ser maior que zero." });
                }

                var existing = await _context.Produtos.FirstOrDefaultAsync(x => x.Id == id);
                if (existing == null)
                {
                    _logger.LogWarning("Produto ID {Id} não encontrado", id);
                    return NotFound(new { message = "Produto não encontrado." });
                }

                existing.Tipo = dto.Tipo;
                existing.Nome = dto.Nome;
                existing.Descricao = dto.Descricao ?? string.Empty;
                existing.Categoria = dto.Categoria;
                existing.Preco = preco; 

                await _context.SaveChangesAsync();
                _logger.LogInformation(" Dados do produto ID {Id} atualizados com sucesso, Preço: {Preco}", id, existing.Preco);

                var actionResult = await GetById(existing.Id);
                if (actionResult is OkObjectResult okResult)
                {
                    return Ok(okResult.Value);
                }

                return NotFound(new { message = "Não foi possível encontrar o produto após a atualização." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao atualizar dados do produto ID: {Id}", id);
                return StatusCode(500, new { message = "Erro interno do servidor.", error = ex.Message });
            }
        }

        [HttpPost("{id:int}/imagens")]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> AtualizarImagens(int id, [FromForm] List<IFormFile> imagens)
        {
            try
            {
                _logger.LogInformation("=== ATUALIZANDO IMAGENS DO PRODUTO ID: {Id} ===", id);

                if (imagens == null || !imagens.Any())
                {
                    return BadRequest(new { message = "Nenhuma imagem foi enviada." });
                }

                var existing = await _context.Produtos.Include(x => x.Imagens).FirstOrDefaultAsync(x => x.Id == id);
                if (existing == null)
                {
                    _logger.LogWarning("Produto ID {Id} não encontrado", id);
                    return NotFound(new { message = "Produto não encontrado." });
                }

                _logger.LogInformation(" Removendo {Count} imagens antigas...", existing.Imagens.Count);
                // Remover imagens antigas
                foreach (var img in existing.Imagens)
                {
                    _storageService.ApagarArquivo(img.Url, DiretorioImagens);
                }
                _context.ProductImages.RemoveRange(existing.Imagens);

                _logger.LogInformation(" Salvando {Count} novas imagens...", imagens.Count);
                // Adicionar novas imagens
                foreach (var img in imagens)
                {
                    var url = await _storageService.SalvarArquivoAsync(img, DiretorioImagens);
                    _context.ProductImages.Add(new ProdutoImage { Url = url, ProdutoId = existing.Id });
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation(" Imagens atualizadas com sucesso");

                return Ok(new { 
                    message = "Imagens atualizadas com sucesso!", 
                    totalImagens = imagens.Count 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao atualizar imagens do produto ID: {Id}", id);
                return StatusCode(500, new { message = "Erro interno do servidor.", error = ex.Message });
            }
        }

        //  DELETE 
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "ADM")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                _logger.LogInformation("=== DELETANDO PRODUTO ID: {Id} ===", id);

                var p = await _context.Produtos.Include(x => x.Imagens).FirstOrDefaultAsync(x => x.Id == id);
                if (p == null)
                {
                    _logger.LogWarning("Produto ID {Id} não encontrado", id);
                    return NotFound(new { message = "Produto não encontrado." });
                }

                _logger.LogInformation(" Deletando {Count} imagens...", p.Imagens.Count);
                foreach (var img in p.Imagens)
                {
                    _storageService.ApagarArquivo(img.Url, DiretorioImagens);
                }

                _context.Produtos.Remove(p);
                await _context.SaveChangesAsync();

                _logger.LogInformation(" Produto e imagens removidos com sucesso");

                return Ok(new { message = "Produto e imagens removidos com sucesso." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao deletar produto ID: {Id}", id);
                return StatusCode(500, new { message = "Erro interno do servidor.", error = ex.Message });
            }
        }
    }
}
