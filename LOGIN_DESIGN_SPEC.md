# 🎨 Especificação de Design do Menu Login — Neo-Brutalism System

Este documento registra em detalhes milimétricos todos os elementos de design, arquitetura visual, CSS, animações, tokens e regras que compõem a tela de Login do **Zelote**. Seu objetivo é garantir que essa identidade visual marcante seja **preservada sem qualquer alteração indesejada** ao longo de futuras refatorações.

---

## 1. Conceito e Estilo Visual

O design do menu de Login segue rigorosamente a estética **Neo-Brutalism (Neu-Brutalismo Web)** moderno, caracterizada por:
- **Contornos espessos e pretos** (`border: 3px` a `4px solid black`).
- **Sombras duras sem desfoque (Hard Drop Shadows)**: sem `blur-radius`, utilizando deslocamento exato (`box-shadow: Xpx Ypx 0 0 #000`).
- **Geometria pura**: cantos retos (`rounded-none`), ausência de arredondamentos suaves nos elementos centrais.
- **Micro-texturas gráficas**: grid quadriculado técnico no fundo (`neo-brutal-grid`) e pontos halftone no cabeçalho (`neo-brutal-dots`).
- **Formas flutuantes coloridas (Floating Shapes)** com rotação e elevação lúdica no canvas de fundo.
- **Faixa de realce inferior (Accent Gradient Bar)** com degradê multicolorido na base do card.

---

## 2. Anatomia Estrutural da Página

```
┌─────────────────────────────────────────────────────────────┐
│ 🟦 Forma Azul Flutuante (12°)                               │
│                   ┌───────────────────────┐                 │
│                   │ █ CABEÇALHO AZUL      │                 │
│                   │ [ Ícone ] Zelote      │                 │
│                   │           Sistema     │  🟩 Forma Verde │
│                   ├───────────────────────┤      Flutuante  │
│                   │ Entre com suas...     │        (-12°)   │
│                   │                       │                 │
│                   │ Email Institucional   │                 │
│                   │ [___________________] │                 │
│                   │ Senha        Esqueceu?│                 │
│                   │ [_________________ 👁]│                 │
│                   │                       │                 │
│                   │ [   ➔] ENTRAR       ] │                 │
│                   │ ───────── ou ─────────│                 │
│                   │ [ G Entrar com Google]│                 │
│                   │                       │                 │
│                   │ Não tem conta? Cad... │                 │
│                   ├───────────────────────┤                 │
│                   │ 🟥🟨🟩 Faixa Gradiente│                 │
│                   └───────────────────────┘                 │
│                      ⬛ Sombra Deslocada                    │
│ 🟥 Forma Vermelha                         🟧 Forma Amarela  │
│   Flutuante (45°)                            Flutuante (6°) │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. O Fundo (Canvas de Fundo & Formas Flutuantes)

### 3.1. Grid Quadriculado Técnico (`neo-brutal-grid`)
O fundo inteiro da tela possui uma malha milimetrada suave inspirada em cadernos de desenho técnico:
```css
/* src/index.css */
.neo-brutal-grid {
  background-image:
    linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
    linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px);
  background-size: 40px 40px;
}
```
* **Opacidade no Login:** `opacity-[0.03]` (Light Mode) e `opacity-[0.05]` (Dark Mode).

### 3.2. Formas Geométricas Flutuantes (`Floating Shapes`)
Quatro blocos coloridos flutuam suavemente nos cantos com sombras neo-brutais e animações assíncronas:

| Forma | Posição | Tamanho | Rotação | Cor do Token | Classe de Animação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Azul** | Superior Esquerda (`top-20 left-10`) | `w-20 h-20` (80px) | `rotate-12` | `bg-primary` | `animate-float` |
| **Verde** | Centro Direita (`top-1/3 right-20`) | `w-12 h-12` (48px) | `rotate-6` | `bg-success` | `animate-float` |
| **Amarela** | Inferior Direita (`bottom-32 right-16`) | `w-16 h-16` (64px) | `rotate-45` | `bg-warning` | `animate-float-delayed` |
| **Vermelha** | Inferior Esquerda (`bottom-20 left-24`) | `w-14 h-14` (56px) | `-rotate-12` | `bg-error` | `animate-float-delayed` |

### 3.3. Keyframes das Animações
```css
/* Flutuação suave com ciclo de 6s */
@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(12deg);
  }
  50% {
    transform: translateY(-20px) rotate(12deg);
  }
}

/* Flutuação defasada de 5s com delay de 1s */
@keyframes float-delayed {
  0%, 100% {
    transform: translateY(0) rotate(45deg);
  }
  50% {
    transform: translateY(-15px) rotate(45deg);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 5s ease-in-out infinite;
  animation-delay: 1s;
}
```

---

## 4. O Card Principal de Autenticação

### 4.1. Camada de Sombra e Estrutura do Card
O card possui largura máxima `max-w-md` (448px) e efeito de sobreposição dupla:
1. **Camada Decorativa Traseira (Offset Backdrop):**
   ```tsx
   <div className="absolute -bottom-3 -right-3 w-full h-full bg-foreground/10 dark:bg-foreground/5 -z-10 rounded-none" />
   ```
2. **Container Principal (`.neo-brutal-card`):**
   * Borda: `3px solid #000000` (Dark: `hsl(var(--neo-border-color))`).
   * Sombra sólida: `4px 4px 0px 0px #000000`.
   * Cantos: `rounded-none` (0px).
   * Fundo: `bg-card` (Branco no light mode).

---

## 5. Cabeçalho do Card (`.neo-brutal-header`)

* **Cor de Fundo:** `bg-primary` (`hsl(217, 91%, 60%)` — Azul elétrico institucional).
* **Borda Inferior:** `border-bottom: 4px solid hsl(var(--neo-border-color) / 0.2)`.
* **Textura de Halftone (`.neo-brutal-dots`):**
  ```css
  .neo-brutal-dots {
    background-image: radial-gradient(circle, currentColor 1.5px, transparent 1.5px);
    background-size: 16px 16px;
  }
  ```
  Renderizado com `opacity-20` sobre o fundo azul.

### 5.1. Caixa do Ícone (`.neo-brutal-icon-box`)
* Caixa quadrada com fundo branco (`bg-card`), texto preto (`text-foreground`).
* Borda: `3px solid #000`.
* Sombra rígida translúcida: `box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.5)`.
* Ícone: `Computer`, `UserPlus` ou `RotateCcw` com `strokeWidth={2.5}`.

### 5.2. Tipografia do Título
* **Título Principal:** `text-4xl font-black tracking-tight leading-none text-white`.
* **Subtítulo:** `text-2xl font-bold opacity-80 text-white`.

---

## 6. Formulários e Componentes Interativos

### 6.1. Campos de Entrada (`.neo-brutal-input`)
```css
.neo-brutal-input {
  height: 3rem; /* 48px */
  font-size: 1rem;
  font-weight: 900; /* Extra bold / black */
  background-color: hsl(var(--input-bg));
  border: 3px solid #000000;
  border-radius: 0px;
  padding-left: 1rem;
  padding-right: 1rem;
  transition: all 0.1s ease;
}

/* Efeito ao Focar (Elevação no clique) */
.neo-brutal-input:focus {
  border-color: hsl(var(--primary));
  box-shadow: 4px 4px 0px 0px hsl(var(--primary) / 0.5);
  transform: translate(-2px, -2px);
  outline: none;
}
```

### 6.2. Botão Principal de Ação (`.neo-brutal-button`)
```css
.neo-brutal-button {
  height: 3.5rem; /* 56px */
  font-size: 1.125rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-radius: 0px;
  border: 3px solid #000000;
  box-shadow: 6px 6px 0px 0px #000000;
  transition: all 0.15s ease;
}

/* Hover: o botão sobe e a sombra aumenta */
.neo-brutal-button:hover:not(:disabled) {
  transform: translate(-3px, -3px);
  box-shadow: 9px 9px 0px 0px #000000;
}

/* Active (Clique): o botão afunda */
.neo-brutal-button:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px 0px #000000;
}
```

### 6.3. Botão do Google (`GoogleLoginButton.tsx`)
* Fundo branco puro com borda cinza `border-gray-300`.
* Cantos: `rounded-none`.
* Sombra neo-brutal translúcida: `shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]`.
* Hover: `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] hover:-translate-y-0.5`.
* Ícone Google SVG oficial inline (4 cores: azul, verde, amarelo, vermelho).

### 6.4. Faixa Decorativa de Base (Accent Stripe)
Na parte inferior extrema do card:
```tsx
<div className="h-2 bg-gradient-to-r from-primary via-warning to-success" />
```
Gera uma linha sólida de 8px com transição de **Azul &rarr; Amarelo &rarr; Verde**, unificando as cores das formas flutuantes da tela.

---

## 7. Checklist de Preservação do Design

Ao realizar qualquer manutenção futura na tela de login, certifique-se de **NÃO**:
- [ ] ❌ Trocar os cantos vivos (`rounded-none`) por cantos arredondados (`rounded-xl` ou `rounded-2xl`).
- [ ] ❌ Trocar sombras duras (`6px 6px 0 0 #000`) por sombras suaves com blur (`shadow-lg` padrão do Tailwind).
- [ ] ❌ Diminuir a espessura das bordas dos inputs para 1px (devem sempre manter `border-3` ou `border-[3px]`).
- [ ] ❌ Remover o grid quadriculado (`.neo-brutal-grid`) ou o padrão pontilhado do header (`.neo-brutal-dots`).
- [ ] ❌ Remover os quatro blocos flutuantes coloridos do fundo.
- [ ] ❌ Alterar as animações `animate-float` e `animate-float-delayed`.
