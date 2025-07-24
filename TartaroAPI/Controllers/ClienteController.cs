using Microsoft.AspNetCore.Mvc;
using TartaroAPI.Models;
using TartaroAPI.Data;

namespace TartaroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClienteController : ControllerBase
    {
        private readonly TartaroDbContext _context;

        public ClienteController(TartaroDbContext context)
        {
            _context = context;
        }

        // GET: api/cliente
        [HttpGet]
        public ActionResult<IEnumerable<Cliente>> GetClientes()
        {
            return Ok(_context.Clientes.ToList());
        }

        // POST: api/cliente
        [HttpPost]
        public ActionResult<Cliente> PostCliente(Cliente cliente)
        {
            if (_context.Clientes.Any(c => c.Email == cliente.Email))
            {
                return BadRequest("Email já cadastrado.");
            }

            _context.Clientes.Add(cliente);
            _context.SaveChanges();

            return CreatedAtAction(nameof(GetClientes), new { id = cliente.Id }, cliente);
        }
    }
}