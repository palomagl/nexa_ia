/*
|--------------------------------------------------------------------------
| NEXA UI KIT — biblioteca de componentes injetada em todo projeto gerado
|--------------------------------------------------------------------------
|
| API e visual no estilo shadcn/ui (o modelo já conhece bem esse formato),
| mas SEM Radix: os primitivos interativos (accordion, tabs) são
| implementados com estado React puro. Motivo: o runtime de preview
| (Sandpack + Tailwind Play CDN) não roda o plugin tailwindcss-animate nem
| lida bem com a árvore de pacotes @radix-ui. Sem Radix, as únicas libs
| extras são class-variance-authority / clsx / tailwind-merge — leves e
| estáveis no bundler do preview.
|
| Esses arquivos entram no projeto do usuário (aparecem na árvore, vão no
| .zip). São "código dele", como no shadcn. O modelo é instruído a compor
| a partir deles em vez de estilizar botão/card/input do zero.
|
| Cores: os componentes usam tokens semânticos do Tailwind (bg-primary,
| text-muted-foreground, border-border, ...) que o front define como cores
| reais no tailwind.config (preview e .zip). A Fase 4 sobrescreve esses
| tokens por tema.
*/

const utils = `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

const button = `import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-muted hover:text-foreground',
        ghost: 'hover:bg-muted hover:text-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
`;

const card = `import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-sm', className)} {...props} />
  ),
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  ),
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';
`;

const input = `import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
`;

const textarea = `import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
`;

const label = `import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn('text-sm font-medium leading-none', className)} {...props} />
  ),
);
Label.displayName = 'Label';
`;

const badge = `import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground border-border',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
`;

const separator = `import { cn } from '../../lib/utils';

export function Separator({
  className,
  orientation = 'horizontal',
}: {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}) {
  return (
    <div
      role="separator"
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
    />
  );
}
`;

const accordion = `import { createContext, useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

type Ctx = { open: string | null; setOpen: (v: string | null) => void };
const AccordionCtx = createContext<Ctx | null>(null);
const ItemCtx = createContext<string>('');

export function Accordion({
  children,
  defaultValue = null,
  className,
}: {
  children: React.ReactNode;
  defaultValue?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState<string | null>(defaultValue);
  return (
    <AccordionCtx.Provider value={{ open, setOpen }}>
      <div className={cn('divide-y divide-border border-y border-border', className)}>{children}</div>
    </AccordionCtx.Provider>
  );
}

export function AccordionItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <ItemCtx.Provider value={value}>{children}</ItemCtx.Provider>;
}

export function AccordionTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = useContext(AccordionCtx)!;
  const value = useContext(ItemCtx);
  const isOpen = ctx.open === value;
  return (
    <button
      type="button"
      onClick={() => ctx.setOpen(isOpen ? null : value)}
      className={cn('flex w-full items-center justify-between py-4 text-left text-sm font-medium transition-all hover:underline', className)}
      aria-expanded={isOpen}
    >
      {children}
      <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
    </button>
  );
}

export function AccordionContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = useContext(AccordionCtx)!;
  const value = useContext(ItemCtx);
  if (ctx.open !== value) return null;
  return <div className={cn('pb-4 text-sm text-muted-foreground', className)}>{children}</div>;
}
`;

const tabs = `import { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

const TabsCtx = createContext<{ value: string; setValue: (v: string) => void } | null>(null);

export function Tabs({
  children,
  defaultValue,
  className,
}: {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsCtx.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = useContext(TabsCtx)!;
  const active = ctx.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
        active ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = useContext(TabsCtx)!;
  if (ctx.value !== value) return null;
  return <div className={cn('mt-2', className)}>{children}</div>;
}
`;

export const UI_KIT_FILES = [
  { name: 'lib/utils.ts', content: utils },
  { name: 'components/ui/button.tsx', content: button },
  { name: 'components/ui/card.tsx', content: card },
  { name: 'components/ui/input.tsx', content: input },
  { name: 'components/ui/textarea.tsx', content: textarea },
  { name: 'components/ui/label.tsx', content: label },
  { name: 'components/ui/badge.tsx', content: badge },
  { name: 'components/ui/separator.tsx', content: separator },
  { name: 'components/ui/accordion.tsx', content: accordion },
  { name: 'components/ui/tabs.tsx', content: tabs },
];

export const UI_KIT_DEPENDENCIES = {
  'class-variance-authority': '^0.7.1',
  clsx: '^2.1.1',
  'tailwind-merge': '^2.5.4',
};

/** Nomes dos arquivos do kit — pra não regenerar/validar/revisar como se
 *  fossem código do modelo. */
export const UI_KIT_PATHS = new Set(UI_KIT_FILES.map(f => f.name));

/** Componentes exportados pelo kit — pra o passo "buracos" do /api/generate
 *  não achar que <Button/>, <Card/>, <Tabs/> etc. são componentes de seção
 *  faltando e tentar regenerá-los. */
export const UI_KIT_COMPONENT_NAMES = new Set([
  'Button',
  'Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter',
  'Input', 'Textarea', 'Label', 'Badge', 'Separator',
  'Accordion', 'AccordionItem', 'AccordionTrigger', 'AccordionContent',
  'Tabs', 'TabsList', 'TabsTrigger', 'TabsContent',
]);

/** Trecho do prompt que apresenta o kit ao modelo. */
export const UI_KIT_CONTRACT = `
======================================================================
BIBLIOTECA DE COMPONENTES (JÁ INCLUÍDA NO PROJETO — USE-A)
======================================================================

O projeto já vem com um kit de componentes no estilo shadcn/ui em
components/ui/ + a helper lib/utils.ts (cn). NÃO recrie esses arquivos e
NÃO estilize botão/card/input/badge do zero — importe e componha a partir
do kit:

- import { Button } from './components/ui/button'
    <Button>  <Button variant="outline" size="lg">  <Button variant="ghost" size="icon">
    variantes: default | secondary | outline | ghost | destructive | link
    tamanhos: default | sm | lg | icon
- import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/card'
- import { Input } from './components/ui/input'
- import { Textarea } from './components/ui/textarea'
- import { Label } from './components/ui/label'
- import { Badge } from './components/ui/badge'   (variant: default | secondary | outline | destructive)
- import { Separator } from './components/ui/separator'
- import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './components/ui/accordion'
    <Accordion defaultValue="item-1"><AccordionItem value="item-1"><AccordionTrigger>P</AccordionTrigger><AccordionContent>R</AccordionContent></AccordionItem></Accordion>
- import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs'
    <Tabs defaultValue="a"><TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList><TabsContent value="a">...</TabsContent></Tabs>

O caminho de import depende de onde está o arquivo que importa:
- de components/Hero.tsx -> './ui/button'
- de App.tsx -> './components/ui/button'

CORES: o kit usa tokens semânticos do Tailwind já configurados no projeto:
bg-primary / text-primary-foreground, bg-secondary, bg-muted /
text-muted-foreground, bg-card, border-border, border-input, ring-ring,
bg-destructive, text-foreground, bg-background. Use esses tokens para o
que for "system" e classes Tailwind normais (cores, gradientes) para os
toques de identidade de cada seção.

Seções que sempre valem componente do kit: cards de produto/serviço/plano
(Card), formulários de contato (Input/Textarea/Label/Button), FAQ
(Accordion), navegação por abas (Tabs), selos/labels (Badge), CTAs
(Button). Continue criando os componentes de SEÇÃO (Hero, Features,
Pricing, Footer...) você mesmo — o kit é a camada de baixo nível.
`;
