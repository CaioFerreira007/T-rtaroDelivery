using TartaroAPI.Data;
using TartaroAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace TartaroAPI.Services
{
    public class ClienteService : IClienteService
    {
        private readonly TartaroDbContext _context;

        public ClienteService(TartaroDbContext context)
        {
            _context = context;
        }

        public Cliente? Autenticar(string email, string senha)
        {
            return _context.Clientes
                .FirstOrDefault(c => c.Email == email && c.SenhaHash == senha); // ⚠️ use hash de senha depois!
        }
    }
}