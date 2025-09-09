
using TartaroAPI.DTO;
using TartaroAPI.Models;

namespace TartaroAPI.Services
{
    public interface IPedidoService
    {
        Task<Pedido> CriarPedidoAsync(PedidoCreateDTO dto);
    }
}