using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TartaroAPI.Data;
using TartaroAPI.DTOs;
using TartaroAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class ProdutosController : ControllerBase
{
    private readonly TartaroDbContext _context;

    public ProdutosController(TartaroDbContext context)
        => _context = context;

    // 🔎 GET: api/produtos?page=1&pageSize=10
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Produto>>> GetAll(
        int page = 1, int pageSize = 10)
    {
        var items = await _context.Produtos
            .OrderBy(p => p.Nome)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(items);
    }

    // 🔍 GET: api/produtos/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Produto>> GetById(int id)
    {
        var produto = await _context.Produtos.FindAsync(id);
        if (produto == null)
            return NotFound(new { message = "Produto não encontrado." });

        return Ok(produto);
    }

    // ➕ POST: api/produtos
    [HttpPost]
    [Authorize(Roles = "ADM")]
    public async Task<IActionResult> Create([FromBody] ProdutoDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (await _context.Produtos.AnyAsync(p => p.Nome == dto.Nome))
            return BadRequest(new { message = "Já existe um produto com esse nome." });

        var produto = new Produto
        {
            Tipo = dto.Tipo ?? "Padrão",
            Nome = dto.Nome,
            Descricao = dto.Descricao,
            Categoria = dto.Categoria,
            Preco = dto.Preco,
            ImagemUrl = dto.ImagemUrl
        };

        _context.Produtos.Add(produto);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = produto.Id }, produto);
    }

    // ✏️ PUT: api/produtos/5
    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADM")]
    public async Task<IActionResult> Update(int id, [FromBody] ProdutoDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var existing = await _context.Produtos.FindAsync(id);
        if (existing == null)
            return NotFound(new { message = "Produto não encontrado." });

        if (existing.Nome != dto.Nome &&
            await _context.Produtos.AnyAsync(p => p.Nome == dto.Nome))
        {
            return BadRequest(new { message = "Já existe outro produto com esse nome." });
        }

        existing.Tipo = dto.Tipo ?? "Padrão";
        existing.Nome = dto.Nome;
        existing.Descricao = dto.Descricao;
        existing.Categoria = dto.Categoria;
        existing.Preco = dto.Preco;
        existing.ImagemUrl = dto.ImagemUrl;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Produto atualizado com sucesso." });
    }

    // 🗑️ DELETE: api/produtos/5
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADM")]
    public async Task<IActionResult> Delete(int id)
    {
        var produto = await _context.Produtos.FindAsync(id);
        if (produto == null)
            return NotFound(new { message = "Produto não encontrado." });

        _context.Produtos.Remove(produto);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Produto removido com sucesso." });
    }
}