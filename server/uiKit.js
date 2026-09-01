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

// Overlay compartilhado por Sheet e Dialog (estado próprio, sem Radix).
const sheet = `import { createContext, useContext, useState, cloneElement, isValidElement } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const SheetCtx = createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);

export function Sheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <SheetCtx.Provider value={{ open, setOpen }}>{children}</SheetCtx.Provider>;
}

export function SheetTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const ctx = useContext(SheetCtx)!;
  const open = () => ctx.setOpen(true);
  if (asChild && isValidElement(children)) {
    return cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick: open });
  }
  return <button type="button" onClick={open}>{children}</button>;
}

export function SheetClose({ children, asChild, className }: { children: React.ReactNode; asChild?: boolean; className?: string }) {
  const ctx = useContext(SheetCtx)!;
  const close = () => ctx.setOpen(false);
  if (asChild && isValidElement(children)) {
    return cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick: close });
  }
  return <button type="button" onClick={close} className={className}>{children}</button>;
}

export function SheetContent({
  children,
  side = 'right',
  className,
}: {
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}) {
  const ctx = useContext(SheetCtx)!;
  if (!ctx.open) return null;
  const pos = {
    right: 'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l',
    left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r',
    top: 'inset-x-0 top-0 border-b',
    bottom: 'inset-x-0 bottom-0 border-t',
  }[side];
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/40" onClick={() => ctx.setOpen(false)} />
      <div className={cn('absolute bg-background p-6 shadow-lg border-border overflow-y-auto', pos, className)}>
        <button type="button" onClick={() => ctx.setOpen(false)} className="absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col space-y-1', className)} {...props} />;
}
export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold text-foreground', className)} {...props} />;
}
export function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}
`;

const dialog = `import { createContext, useContext, useState, cloneElement, isValidElement } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const DialogCtx = createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);

export function Dialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <DialogCtx.Provider value={{ open, setOpen }}>{children}</DialogCtx.Provider>;
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const ctx = useContext(DialogCtx)!;
  const open = () => ctx.setOpen(true);
  if (asChild && isValidElement(children)) {
    return cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick: open });
  }
  return <button type="button" onClick={open}>{children}</button>;
}

export function DialogClose({ children, asChild, className }: { children: React.ReactNode; asChild?: boolean; className?: string }) {
  const ctx = useContext(DialogCtx)!;
  const close = () => ctx.setOpen(false);
  if (asChild && isValidElement(children)) {
    return cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick: close });
  }
  return <button type="button" onClick={close} className={className}>{children}</button>;
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = useContext(DialogCtx)!;
  if (!ctx.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/50" onClick={() => ctx.setOpen(false)} />
      <div className={cn('relative w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-lg', className)}>
        <button type="button" onClick={() => ctx.setOpen(false)} className="absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col space-y-1.5', className)} {...props} />;
}
export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold text-foreground', className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex justify-end gap-2', className)} {...props} />;
}
`;

const dropdownMenu = `import { createContext, useContext, useEffect, useRef, useState, cloneElement, isValidElement } from 'react';
import { cn } from '../../lib/utils';

const MenuCtx = createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  return (
    <MenuCtx.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block text-left">{children}</div>
    </MenuCtx.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const ctx = useContext(MenuCtx)!;
  const toggle = () => ctx.setOpen(!ctx.open);
  if (asChild && isValidElement(children)) {
    return cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick: toggle });
  }
  return <button type="button" onClick={toggle}>{children}</button>;
}

export function DropdownMenuContent({ children, align = 'end', className }: { children: React.ReactNode; align?: 'start' | 'end'; className?: string }) {
  const ctx = useContext(MenuCtx)!;
  if (!ctx.open) return null;
  return (
    <div className={cn('absolute z-50 mt-2 min-w-[10rem] rounded-md border border-border bg-popover p-1 shadow-md', align === 'end' ? 'right-0' : 'left-0', className)}>
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  const ctx = useContext(MenuCtx)!;
  return (
    <button
      type="button"
      onClick={() => { onClick?.(); ctx.setOpen(false); }}
      className={cn('flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted', className)}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props} />;
}
export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('-mx-1 my-1 h-px bg-border', className)} />;
}
`;

const avatar = `import { useState } from 'react';
import { cn } from '../../lib/utils';

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted', className)} {...props} />;
}

export function AvatarImage({ src, alt = '', className }: { src?: string; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return <img src={src} alt={alt} onError={() => setFailed(true)} className={cn('aspect-square h-full w-full object-cover', className)} />;
}

export function AvatarFallback({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground', className)}>
      {children}
    </span>
  );
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
  { name: 'components/ui/sheet.tsx', content: sheet },
  { name: 'components/ui/dialog.tsx', content: dialog },
  { name: 'components/ui/dropdown-menu.tsx', content: dropdownMenu },
  { name: 'components/ui/avatar.tsx', content: avatar },
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
  'Sheet', 'SheetTrigger', 'SheetClose', 'SheetContent', 'SheetHeader', 'SheetTitle', 'SheetDescription',
  'Dialog', 'DialogTrigger', 'DialogClose', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription', 'DialogFooter',
  'DropdownMenu', 'DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuLabel', 'DropdownMenuSeparator',
  'Avatar', 'AvatarImage', 'AvatarFallback',
]);

/** Módulos que o modelo PODE importar de ./ui/ — qualquer outro caminho
 *  ./ui/<x> é inválido (o kit não tem) e quebra o bundle do preview. */
export const UI_KIT_MODULES = new Set([
  'button', 'card', 'input', 'textarea', 'label', 'badge', 'separator',
  'accordion', 'tabs', 'sheet', 'dialog', 'dropdown-menu', 'avatar',
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
- import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from './components/ui/sheet'
    gaveta lateral (menu mobile). <SheetTrigger asChild><Button>...</Button></SheetTrigger><SheetContent side="right">...</SheetContent>
- import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './components/ui/dialog'
    modal centralizado. mesmo padrão do Sheet.
- import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './components/ui/dropdown-menu'
    <DropdownMenu><DropdownMenuTrigger asChild><Button>...</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={...}>X</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
- import { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar'
    <Avatar><AvatarImage src="..." alt="..." /><AvatarFallback>AB</AvatarFallback></Avatar>

ESTA É A LISTA COMPLETA. Os únicos módulos em ./ui/ são: button, card,
input, textarea, label, badge, separator, accordion, tabs, sheet, dialog,
dropdown-menu, avatar. NÃO importe nenhum outro (ex.: ./ui/sheet existe,
mas ./ui/select, ./ui/carousel, ./ui/table, ./ui/tooltip NÃO existem).
Se precisar de algo fora dessa lista, construa inline com useState no
próprio componente de seção — não invente um arquivo em ./ui/.

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
