using Microsoft.AspNetCore.Mvc;
using TartaroAPI.Data;
using TartaroAPI.Models;

namespace TartaroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProdutoController : ControllerBase
    {
        private readonly TartaroDbContext _context;

        public ProdutoController(TartaroDbContext context)
        {
            _context = context;
        }

        // GET: api/produto
        [HttpGet]
        public ActionResult<IEnumerable<Produto>> GetProdutos()
        {
            return Ok(_context.Produtos.ToList());
        }

        // GET: api/produto/5
        [HttpGet("{id}")]
        public ActionResult<Produto> GetProduto(int id)
        {
            var produto = _context.Produtos.Find(id);
            if (produto == null)
            {
                return NotFound();
            }
            return Ok(produto);
        }

        // POST: api/produto
        [HttpPost]
        public ActionResult<Produto> PostProduto(Produto produto)
        {
            _context.Produtos.Add(produto);
            _context.SaveChanges();

            return CreatedAtAction(nameof(GetProduto), new { id = produto.Id }, produto);
        }

        // DELETE: api/produto/5
        [HttpDelete("{id}")]
        public IActionResult DeleteProduto(int id)
        {
            var produto = _context.Produtos.Find(id);
            if (produto == null)
            {
                return NotFound();
            }

            _context.Produtos.Remove(produto);
            _context.SaveChanges();

            return NoContent();
        }
    }
}