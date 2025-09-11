'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Code,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  Paperclip,
  Type,
  Palette,
  Highlighter,
  RemoveFormatting,
  IndentDecrease,
  IndentIncrease,
  Smile,
} from 'lucide-react';
import { motion } from 'framer-motion';

// Design System Tokens
const tokens = {
  colors: {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    gray50: '#FAFBFC',
    gray100: '#F1F3F5',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    softGreen: '#E6F4EC',
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.2,
      base: 1.5,
      relaxed: 1.7,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  transitions: {
    fast: '150ms ease-out',
  },
};

interface RichTextEditorProps {
  value: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  onAttachmentAdd?: (files: File[]) => void;
  attachments?: Array<{ name: string; size: number; id: string }>;
  onAttachmentRemove?: (id: string) => void;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your message...',
  onAttachmentAdd,
  attachments = [],
  onAttachmentRemove,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder: placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value || '',
    immediatelyRender: false, // Prevent SSR hydration mismatch
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      onChange(html, text);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px]',
        style: `font-family: ${tokens.typography.fontFamily}; color: ${tokens.colors.charcoal}; line-height: ${tokens.typography.lineHeights.relaxed}; padding: ${tokens.spacing.md};`,
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onAttachmentAdd) {
      onAttachmentAdd(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Only render on client side to prevent hydration mismatches
  if (!mounted || !editor) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '400px',
        backgroundColor: tokens.colors.white,
      }}>
        <div style={{
          padding: tokens.spacing.md,
          borderBottom: `1px solid ${tokens.colors.gray200}`,
          backgroundColor: tokens.colors.gray50,
          height: '52px',
        }} />
        <div style={{
          flex: 1,
          padding: tokens.spacing.xl,
          color: tokens.colors.gray400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          Loading editor...
        </div>
      </div>
    );
  }

  const ToolbarButton = ({ 
    onClick, 
    active = false, 
    disabled = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    active?: boolean; 
    disabled?: boolean; 
    children: React.ReactNode; 
    title: string;
  }) => (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '6px',
        backgroundColor: active ? tokens.colors.gray100 : 'transparent',
        border: 'none',
        borderRadius: tokens.radii.sm,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: tokens.transitions.fast,
        opacity: disabled ? 0.5 : 1,
        minWidth: '32px',
        height: '32px',
      }}
      whileHover={{ backgroundColor: active ? tokens.colors.gray200 : tokens.colors.gray100 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );

  const Separator = () => (
    <div style={{
      width: '1px',
      height: '24px',
      backgroundColor: tokens.colors.gray200,
      margin: `0 ${tokens.spacing.xs}`,
    }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Editor Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: tokens.colors.white,
        minHeight: '200px',
        padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
      }}>
        <EditorContent editor={editor} />
      </div>

      {/* Attachments Display */}
      {attachments.length > 0 && (
        <div style={{
          padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
          borderTop: `1px solid ${tokens.colors.gray100}`,
          backgroundColor: tokens.colors.white,
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: tokens.spacing.sm,
          }}>
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: tokens.spacing.xs,
                  padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                  backgroundColor: tokens.colors.gray50,
                  border: `1px solid ${tokens.colors.gray200}`,
                  borderRadius: tokens.radii.sm,
                  fontSize: tokens.typography.sizes.xs,
                }}
              >
                <Paperclip size={12} color={tokens.colors.gray500} />
                <span>{attachment.name}</span>
                <span style={{ color: tokens.colors.gray400 }}>
                  ({formatFileSize(attachment.size)})
                </span>
                {onAttachmentRemove && (
                  <button
                    onClick={() => onAttachmentRemove(attachment.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      color: tokens.colors.gray400,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar at Bottom - Gmail Style */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
        borderTop: `1px solid ${tokens.colors.gray200}`,
        backgroundColor: tokens.colors.white,
        gap: tokens.spacing.xs,
      }}>
        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold size={18} color={tokens.colors.gray700} strokeWidth={1.5} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic size={18} color={tokens.colors.gray700} strokeWidth={1.5} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={18} color={tokens.colors.gray700} strokeWidth={1.5} />
        </ToolbarButton>
        
        <Separator />
        
        {/* Text Color */}
        <div style={{ position: 'relative' }}>
          <input
            type="color"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            style={{
              position: 'absolute',
              opacity: 0,
              width: '32px',
              height: '32px',
              cursor: 'pointer',
            }}
            id="text-color"
          />
          <label htmlFor="text-color">
            <ToolbarButton
              onClick={() => document.getElementById('text-color')?.click()}
              title="Text Color"
            >
              <Type size={18} color={tokens.colors.gray700} strokeWidth={1.5} />
            </ToolbarButton>
          </label>
        </div>
        
        <Separator />
        
        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={18} color={tokens.colors.gray700} strokeWidth={1.5} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered size={18} color={tokens.colors.gray700} strokeWidth={1.5} />
        </ToolbarButton>
        
        <Separator />
        
        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft size={18} color={tokens.colors.gray700} strokeWidth={1.5} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter size={18} color={tokens.colors.gray700} strokeWidth={1.5} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight size={18} color={tokens.colors.gray700} strokeWidth={1.5} />
        </ToolbarButton>
        
        <Separator />
        
        {/* Link */}
        <ToolbarButton
          onClick={setLink}
          active={editor.isActive('link')}
          title="Insert Link (Ctrl+K)"
        >
          <Link2 size={18} color={tokens.colors.gray700} strokeWidth={1.5} />
        </ToolbarButton>
        
        {/* Image */}
        <ToolbarButton
          onClick={addImage}
          title="Insert Image"
        >
          <ImageIcon size={18} color={tokens.colors.gray700} strokeWidth={1.5} />
        </ToolbarButton>
        
        <Separator />
        
        {/* Attachments */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="Attach Files"
        >
          <Paperclip size={18} color={tokens.colors.gray700} strokeWidth={1.5} />
        </ToolbarButton>
      </div>
    </div>
  );
}