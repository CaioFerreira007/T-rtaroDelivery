using TartaroAPI.Models;
namespace TartaroAPI.Services
{
    public interface IClienteService
    {
        Cliente? Autenticar(string email, string senha);
    }
}