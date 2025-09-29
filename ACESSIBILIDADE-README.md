# 🔧 Guia de Correção de Acessibilidade

Este guia contém scripts e componentes para corrigir automaticamente problemas de acessibilidade no projeto.

## 📋 Scripts Disponíveis

### 1. `accessibility-check.js` - Identificar Problemas
Execute no console do DevTools para identificar todos os problemas:

```javascript
// Cole no console (aba Elements do DevTools)
// ... conteúdo do arquivo accessibility-check.js
```

### 2. `fix-accessibility.js` - Correção Automática
Execute no console para corrigir automaticamente os problemas:

```javascript
// Cole no console após identificar os problemas
// ... conteúdo do arquivo fix-accessibility.js
```

### 3. `final-accessibility-check.js` - Verificação Final
Execute para confirmar que todos os problemas foram resolvidos:

```javascript
// Cole no console para verificar o resultado final
// ... conteúdo do arquivo final-accessibility-check.js
```

## 🧩 Componentes FormField

### FormField - Campo de Texto Padrão
```tsx
import { FormField } from '@/components/ui/FormField';

<FormField
  label="Título do curso"
  name="titulo"
  placeholder="Ex.: Cultivo Indoor do Zero"
  required
  autoComplete="organization-title"
/>
```

### CheckboxField - Campo de Checkbox
```tsx
import { CheckboxField } from '@/components/ui/FormField';

<CheckboxField
  label="Publicar curso"
  name="publicar"
  checked={publicar}
  onChange={(e) => setPublicar(e.target.checked)}
/>
```

### RadioField - Campo de Radio
```tsx
import { RadioField } from '@/components/ui/FormField';

<RadioField
  label="Básico"
  name="nivel"
  value="basico"
  checked={nivel === 'basico'}
  onChange={(e) => setNivel(e.target.value)}
/>
```

### TextareaField - Campo de Textarea
```tsx
import { TextareaField } from '@/components/ui/FormField';

<TextareaField
  label="Descrição"
  name="descricao"
  rows={4}
  placeholder="Descreva o curso..."
  autoComplete="off"
/>
```

## 🎯 Regras de Ouro

### ✅ Sempre Faça:
1. **Todo campo deve ter `name`** (para enviar valor ao backend)
2. **Todo campo deve ter `id`** (para vincular com `<label for>`)
3. **Todo campo deve ter um `label`** (visível ou `sr-only`)
4. **Use `autocomplete` apropriado** quando fizer sentido
5. **Associe erros com `aria-describedby`**

### ❌ Nunca Faça:
1. Campos sem `id` e `name`
2. Labels sem associação com campos
3. Checkbox/Radio sem `id` e `<label for>`
4. Campos obrigatórios sem `required` e `aria-required`

## 🔍 Como Usar os Scripts

### Passo 1: Identificar Problemas
1. Abra o DevTools (F12)
2. Vá para a aba "Console"
3. Cole o conteúdo de `accessibility-check.js`
4. Pressione Enter
5. Anote quantos problemas foram encontrados

### Passo 2: Corrigir Automaticamente
1. No mesmo console, cole o conteúdo de `fix-accessibility.js`
2. Pressione Enter
3. Veja os logs de correção

### Passo 3: Verificar Resultado
1. Cole o conteúdo de `final-accessibility-check.js`
2. Pressione Enter
3. Confirme que todos os problemas foram resolvidos

## 📊 Exemplo de Saída Esperada

```
🔍 VERIFICAÇÃO FINAL DE ACESSIBILIDADE

❌ CAMPOS SEM ID E NAME: 0
✅ Todos os campos têm id e/ou name!

❌ LABELS SEM ASSOCIAÇÃO: 0
✅ Todos os labels estão associados!

⚠️ CAMPOS COM ID MAS SEM NAME: 0
✅ Todos os campos com id também têm name!

⚠️ LABELS COM FOR MAS SEM INPUT CORRESPONDENTE: 0
✅ Todos os labels com for têm input correspondente!

📊 RESUMO FINAL:
- Campos sem id e name: 0
- Labels sem associação: 0
- Campos com id mas sem name: 0
- Labels com for inválido: 0

🎯 TOTAL DE PROBLEMAS CRÍTICOS: 0

🎉 PARABÉNS! Todos os problemas críticos de acessibilidade foram resolvidos!
✅ O projeto está em conformidade com as boas práticas de acessibilidade web.
```

## 🚀 Integração com React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/ui/FormField';

const { register, formState: { errors } } = useForm();

<FormField
  label="E-mail"
  name="email"
  type="email"
  {...register('email', { required: 'Informe seu e-mail' })}
  error={errors.email?.message as string}
  autoComplete="email"
/>
```

## 🎨 Estilos Padrão

Os componentes FormField já incluem estilos consistentes:
- Background: `rgba(255, 255, 255, 0.07)`
- Border: `rgba(255, 255, 255, 0.2)`
- Color: `white`
- Focus: `ring-2 ring-emerald-500`
- Error: `border-red-500`

## 🔧 Troubleshooting

### Problema: Script não executa
**Solução:** Certifique-se de que está na aba "Console" do DevTools, não "Elements"

### Problema: Campos ainda sem id/name
**Solução:** Execute o script `fix-accessibility.js` novamente

### Problema: Labels não associados
**Solução:** Verifique se o `htmlFor` do label corresponde ao `id` do input

### Problema: Autocomplete não funciona
**Solução:** Use valores canônicos como `email`, `name`, `current-password`, etc.

## 📚 Recursos Adicionais

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [React Accessibility](https://reactjs.org/docs/accessibility.html)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

---

**💡 Dica:** Execute os scripts em todas as páginas do projeto para garantir acessibilidade completa!

