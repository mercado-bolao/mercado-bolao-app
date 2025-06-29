
# Configuração para Produção EFÍ Pay

## 1. Variáveis de Ambiente (.env)

Para rodar em produção, configure as seguintes variáveis:

```env
# Produção EFÍ
EFI_SANDBOX=false
EFI_CLIENT_ID=seu_client_id_producao
EFI_CLIENT_SECRET=seu_client_secret_producao
EFI_PIX_KEY=sua_chave_pix_producao
EFI_CERTIFICATE_PATH=./certs/certificado-efi.p12
EFI_CERTIFICATE_PASSPHRASE=senha_do_certificado
```

## 2. Certificado Digital

### Certificado A1 (.p12)
- Coloque o arquivo .p12 na pasta `certs/`
- Configure o caminho em `EFI_CERTIFICATE_PATH`
- Configure a senha em `EFI_CERTIFICATE_PASSPHRASE`

### Certificado A1 (.pem)
Se você tiver certificado em formato .pem, será necessário ajustar o código para usar:
```typescript
const agent = new https.Agent({
  cert: fs.readFileSync('./certs/certificado.pem'),
  key: fs.readFileSync('./certs/chave-privada.pem'),
});
```

## 3. Diferenças Sandbox vs Produção

### Sandbox (Teste)
- `EFI_SANDBOX=true`
- Não precisa de certificado
- URLs da API: `https://pix-h.api.efipay.com.br/`
- PIX gerado não movimenta dinheiro real

### Produção (Real)
- `EFI_SANDBOX=false`
- **OBRIGATÓRIO** ter certificado digital
- URLs da API: `https://pix.api.efipay.com.br/`
- PIX gerado movimenta dinheiro real

## 4. Checklist para Produção

- [ ] Credenciais de produção configuradas
- [ ] Certificado digital válido instalado
- [ ] Chave PIX de produção configurada
- [ ] Variável `EFI_SANDBOX=false`
- [ ] Testar em ambiente de homologação primeiro
- [ ] Verificar logs de erro em produção

## 5. Troubleshooting

### Erro de Certificado
```
Error: unable to verify the first certificate
```
- Verifique se o certificado está no caminho correto
- Verifique se a senha está correta
- Verifique se o certificado não está vencido

### Erro de Credenciais
```
Error: 401 Unauthorized
```
- Verifique se CLIENT_ID e CLIENT_SECRET estão corretos
- Verifique se as credenciais são de produção (não sandbox)

### Erro de Chave PIX
```
Error: 422 Unprocessable Entity
```
- Verifique se a chave PIX está registrada na conta EFÍ
- Verifique o formato da chave PIX

## 6. Monitoramento

Em produção, monitore:
- Logs de erro da API EFÍ
- Tempo de resposta das requisições
- Taxa de sucesso dos PIX gerados
- Webhooks de confirmação de pagamento
