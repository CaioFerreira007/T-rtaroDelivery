// Services/EmailService.cs
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace TartaroAPI.Services
{
    public interface IEmailService
    {
        Task EnviarEmailRecuperacaoAsync(string emailDestino, string token);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task EnviarEmailRecuperacaoAsync(string emailDestino, string token)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _configuration["EmailSettings:SenderName"],
                _configuration["EmailSettings:SenderEmail"]));

            message.To.Add(new MailboxAddress("", emailDestino));
            message.Subject = "🔒 Recuperação de Senha - Tártaro Delivery";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2>🔒 Recuperação de Senha</h2>
                    <p>Olá!</p>
                    <p>Você solicitou a recuperação de senha para sua conta no Tártaro Delivery.</p>
                    <p>Clique no botão abaixo para criar uma nova senha:</p>
                    
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='http://localhost:3000/alterar-senha/{token}' 
                           style='background-color: #007bff; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; font-weight: bold;'>
                            Alterar Senha
                        </a>
                    </div>
                    
                    <p><small>Este link expira em 1 hora.</small></p>
                    <p><small>Se você não solicitou esta recuperação, ignore este email.</small></p>
                    
                    <hr>
                    <p><small>Tártaro Delivery - Seu delivery favorito! 🍕</small></p>
                </div>"
            };

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(
                _configuration["EmailSettings:SmtpServer"],
                int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587"), // Adicione ?? "587"
                SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(
                _configuration["EmailSettings:SenderEmail"],
                _configuration["EmailSettings:SenderPassword"]);

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}