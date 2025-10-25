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
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task EnviarEmailRecuperacaoAsync(string emailDestino, string token)
        {
            try
            {
                // Pegar URL do frontend do appsettings
                var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:3000";
                var resetUrl = $"{frontendUrl}/alterar-senha/{token}";

                _logger.LogInformation(" Enviando email de recuperação para: {Email}", emailDestino);
                _logger.LogInformation(" URL de recuperação: {ResetUrl}", resetUrl);

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(
                    _configuration["EmailSettings:SenderName"],
                    _configuration["EmailSettings:SenderEmail"]));

                message.To.Add(new MailboxAddress("", emailDestino));
                message.Subject = "🔒 Recuperação de Senha - Tártaro Delivery";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <div style='background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;'>
                            <h2 style='margin: 0;'>🔒 Recuperação de Senha</h2>
                        </div>
                        
                        <div style='background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;'>
                            <p style='font-size: 16px; color: #333;'>Olá!</p>
                            <p style='font-size: 16px; color: #333;'>Você solicitou a recuperação de senha para sua conta no Tártaro Delivery.</p>
                            <p style='font-size: 16px; color: #333;'>Clique no botão abaixo para criar uma nova senha:</p>
                            
                            <div style='text-align: center; margin: 40px 0;'>
                                <a href='{resetUrl}' 
                                   style='background-color: #007bff; 
                                          color: white; 
                                          padding: 15px 40px; 
                                          text-decoration: none; 
                                          border-radius: 5px; 
                                          font-weight: bold;
                                          font-size: 16px;
                                          display: inline-block;'>
                                    Alterar Senha
                                </a>
                            </div>
                            
                            <div style='background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;'>
                                <p style='margin: 0; color: #856404;'><strong>⏰ Este link expira em 1 hora.</strong></p>
                            </div>
                            
                            <p style='font-size: 14px; color: #666;'>Se você não solicitou esta recuperação, ignore este email.</p>
                            
                            <hr style='border: none; border-top: 1px solid #dee2e6; margin: 30px 0;'>
                            
                            <p style='font-size: 12px; color: #999; text-align: center;'>
                                Tártaro Delivery - Seu delivery favorito! 🍔<br>
                                <a href='https://tartarodelivery.com.br' style='color: #007bff; text-decoration: none;'>
                                    www.tartarodelivery.com.br
                                </a>
                            </p>
                        </div>
                    </div>"
                };

                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                
                var smtpServer = _configuration["EmailSettings:SmtpServer"];
                var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
                var senderEmail = _configuration["EmailSettings:SenderEmail"];
                var senderPassword = _configuration["EmailSettings:SenderPassword"];

                _logger.LogInformation(" Conectando ao servidor SMTP: {Server}:{Port}", smtpServer, smtpPort);

                await client.ConnectAsync(smtpServer, smtpPort, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(senderEmail, senderPassword);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation(" Email enviado com sucesso para: {Email}", emailDestino);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Erro ao enviar email de recuperação para {Email}", emailDestino);
                throw new Exception($"Erro ao enviar email: {ex.Message}", ex);
            }
        }
    }
}