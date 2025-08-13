import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER || 'default@email.com',
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || 'default_pass',
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  async sendApprovalNotification(quotationRequest: any): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'sistema@trustcota.com',
        to: quotationRequest.requesterEmail || 'requisitante@exemplo.com',
        subject: `Cotação Aprovada - ${quotationRequest.requestNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976D2;">Cotação Aprovada</h2>
            <p>Sua requisição de cotação foi aprovada!</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Detalhes da Requisição:</h3>
              <p><strong>Número:</strong> ${quotationRequest.requestNumber}</p>
              <p><strong>Título:</strong> ${quotationRequest.title}</p>
              <p><strong>Valor Aprovado:</strong> R$ ${quotationRequest.approvedAmount}</p>
              <p><strong>Data de Aprovação:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            
            <p>O pedido de compra será gerado automaticamente e você receberá uma notificação em breve.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">
              TrustCota Sys - Sistema de Compras e Cotações<br>
              LP Administradora
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Approval notification sent successfully');
    } catch (error) {
      console.error('Error sending approval notification:', error);
      throw new Error('Failed to send approval notification');
    }
  }

  async sendQuotationRequestNotification(suppliers: any[], quotationRequest: any): Promise<void> {
    try {
      const mailPromises = suppliers.map(async (supplier) => {
        const mailOptions = {
          from: process.env.SMTP_USER || 'sistema@trustcota.com',
          to: supplier.email,
          subject: `Nova Solicitação de Cotação - ${quotationRequest.requestNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1976D2;">Nova Solicitação de Cotação</h2>
              <p>Olá ${supplier.contactPerson || supplier.name},</p>
              <p>Temos uma nova solicitação de cotação para você:</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Detalhes da Solicitação:</h3>
                <p><strong>Número:</strong> ${quotationRequest.requestNumber}</p>
                <p><strong>Título:</strong> ${quotationRequest.title}</p>
                <p><strong>Descrição:</strong> ${quotationRequest.description}</p>
                <p><strong>Urgência:</strong> ${quotationRequest.urgency}</p>
                <p><strong>Data Limite:</strong> ${quotationRequest.expectedDeliveryDate ? new Date(quotationRequest.expectedDeliveryDate).toLocaleDateString('pt-BR') : 'A definir'}</p>
              </div>
              
              <p>Para enviar sua cotação, acesse nosso sistema ou responda este email.</p>
              
              <div style="margin: 30px 0;">
                <a href="#" style="background-color: #1976D2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Acessar Sistema</a>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 12px;">
                TrustCota Sys - Sistema de Compras e Cotações<br>
                LP Administradora
              </p>
            </div>
          `,
        };

        return this.transporter.sendMail(mailOptions);
      });

      await Promise.all(mailPromises);
      console.log('Quotation request notifications sent successfully');
    } catch (error) {
      console.error('Error sending quotation request notifications:', error);
      throw new Error('Failed to send quotation request notifications');
    }
  }

  async sendRejectionNotification(quotationRequest: any, reason: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'sistema@trustcota.com',
        to: quotationRequest.requesterEmail || 'requisitante@exemplo.com',
        subject: `Cotação Rejeitada - ${quotationRequest.requestNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f;">Cotação Rejeitada</h2>
            <p>Sua requisição de cotação foi rejeitada.</p>
            
            <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;">
              <h3>Detalhes da Requisição:</h3>
              <p><strong>Número:</strong> ${quotationRequest.requestNumber}</p>
              <p><strong>Título:</strong> ${quotationRequest.title}</p>
              <p><strong>Motivo da Rejeição:</strong> ${reason}</p>
            </div>
            
            <p>Por favor, revise os detalhes e faça uma nova solicitação com as correções necessárias.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">
              TrustCota Sys - Sistema de Compras e Cotações<br>
              LP Administradora
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Rejection notification sent successfully');
    } catch (error) {
      console.error('Error sending rejection notification:', error);
      throw new Error('Failed to send rejection notification');
    }
  }

  async sendWeeklyReport(userEmail: string, reportData: any): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'sistema@trustcota.com',
        to: userEmail,
        subject: 'Relatório Semanal - TrustCota Sys',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976D2;">Relatório Semanal</h2>
            <p>Confira o resumo das atividades desta semana:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Estatísticas da Semana:</h3>
              <p><strong>Cotações Criadas:</strong> ${reportData.quotationsCreated || 0}</p>
              <p><strong>Cotações Aprovadas:</strong> ${reportData.quotationsApproved || 0}</p>
              <p><strong>Economia Gerada:</strong> R$ ${reportData.savingsGenerated || 0}</p>
              <p><strong>Novos Fornecedores:</strong> ${reportData.newSuppliers || 0}</p>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">
              TrustCota Sys - Sistema de Compras e Cotações<br>
              LP Administradora
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Weekly report sent successfully');
    } catch (error) {
      console.error('Error sending weekly report:', error);
      throw new Error('Failed to send weekly report');
    }
  }
}

export const emailService = new EmailService();
