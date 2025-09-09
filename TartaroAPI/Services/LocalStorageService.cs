
namespace TartaroAPI.Services
{
    public class LocalStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public LocalStorageService(IWebHostEnvironment env, IHttpContextAccessor httpContextAccessor)
        {
            _env = env;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> SalvarArquivoAsync(IFormFile arquivo, string diretorio)
        {
            var ext = Path.GetExtension(arquivo.FileName).ToLowerInvariant();
            var permitidos = new[] { ".jpg", ".jpeg", ".png", ".webp" };

            if (!permitidos.Contains(ext))
            {
                throw new ArgumentException("Extensão de arquivo não permitida.");
            }

            var nomeArquivo = $"{Guid.NewGuid()}{ext}";
            var pastaDestino = Path.Combine(_env.WebRootPath, diretorio);

            if (!Directory.Exists(pastaDestino))
            {
                Directory.CreateDirectory(pastaDestino);
            }

            var caminhoCompleto = Path.Combine(pastaDestino, nomeArquivo);

            using (var stream = new FileStream(caminhoCompleto, FileMode.Create))
            {
                await arquivo.CopyToAsync(stream);
            }

            var request = _httpContextAccessor.HttpContext?.Request;
            var urlBase = $"{request?.Scheme}://{request?.Host}";

            return $"{urlBase}/{diretorio}/{nomeArquivo}";
        }

        public void ApagarArquivo(string url, string diretorio)
        {
            if (string.IsNullOrEmpty(url)) return;

            var nomeArquivo = Path.GetFileName(url);
            var caminhoCompleto = Path.Combine(_env.WebRootPath, diretorio, nomeArquivo);

            if (File.Exists(caminhoCompleto))
            {
                File.Delete(caminhoCompleto);
            }
        }
    }
}