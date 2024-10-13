import React, { useState, useRef } from 'react';
import { Editor, EditorState, RichUtils, getDefaultKeyBinding, DraftHandleValue, DraftStyleMap, ContentBlock, convertFromRaw, convertToRaw } from 'draft-js';
import { draftToMarkdown, markdownToDraft } from 'markdown-draft-js';
import 'draft-js/dist/Draft.css';
import { Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, TextQuote, List, ListOrdered, Code, Bold, Italic, Underline, Baseline } from 'lucide-react';
import { Toggle } from './toggle';
import { DecoratorFactory } from 'react-highlight-within-textarea'
import { headlights } from '@/lib/logics';

const styleMap: DraftStyleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

function getBlockStyle(block: ContentBlock): string {
  switch (block.getType()) {
    case 'blockquote': return 'RichEditor-blockquote';
    default: return '';
  }
}

const BLOCK_TYPES = [
  {label: 'H1', style: 'header-one' , icon: Heading1},
  {label: 'H2', style: 'header-two' , icon: Heading2},
  {label: 'H3', style: 'header-three' , icon: Heading3},
  {label: 'H4', style: 'header-four' , icon: Heading4},
  {label: 'H5', style: 'header-five' , icon: Heading5},
  {label: 'H6', style: 'header-six' , icon: Heading6},
  {label: 'Blockquote', style: 'blockquote' , icon: TextQuote},
  {label: 'UL', style: 'unordered-list-item' , icon: List},
  {label: 'OL', style: 'ordered-list-item' , icon: ListOrdered},
  {label: 'Code Block', style: 'code-block', icon: Code},
];

const INLINE_STYLES = [
  {label: 'Bold', style: 'BOLD', icon: Bold},
  {label: 'Italic', style: 'ITALIC', icon: Italic},
  {label: 'Underline', style: 'UNDERLINE', icon: Underline},
  {label: 'Monospace', style: 'CODE', icon: Baseline},
];

interface BlockStyleControlsProps {
  editorState: EditorState;
  onToggleBlock: (inlineStyle: string) => void;
  onToggleInline: (inlineStyle: string) => void;
  extraToolButtons?: React.JSX.Element
}

function BlockStyleControls({ editorState, onToggleBlock, onToggleInline, extraToolButtons }: BlockStyleControlsProps) {
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  const currentStyle = editorState.getCurrentInlineStyle();

  return (
    <div className="flex gap-1 p-1">
      {BLOCK_TYPES.map((type) => {
        const Icon = type.icon;
        return (
          <Toggle key={type.label} pressed={type.style === blockType} onClick={() => onToggleBlock(type.style)}>
            <Icon size={16} />
          </Toggle>
        );
      })}
      {INLINE_STYLES.map((type) => {
          const Icon = type.icon;
          return (
            <Toggle key={type.label} pressed={currentStyle.has(type.style)} onClick={() => onToggleInline(type.style)}>
              <Icon size={16} />
            </Toggle>
          );
        }
      )}
      {extraToolButtons}
    </div>
  );
}

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  extraToolButtons?: React.JSX.Element
}

function RichTextEditor({ initialContent, onChange, extraToolButtons }: RichTextEditorProps) {
  const [editorState, setEditorState] = useState(() => {
    if (initialContent) {
      const contentState = convertFromRaw(markdownToDraft(initialContent));
      return EditorState.createWithContent(contentState);
    }
    return EditorState.createEmpty();
  });
  
  const editor = useRef<Editor>(null);

  const focus = () => {
    if (editor.current) editor.current.focus();
  };

  const handleKeyCommand = (command: string, editorState: EditorState): DraftHandleValue => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const mapKeyToEditorCommand = (e: React.KeyboardEvent) => {
    if (e.keyCode === 9 /* TAB */) {
      const newEditorState = RichUtils.onTab(
        e,
        editorState,
        4, /* maxDepth */
      );
      if (newEditorState !== editorState) {
        setEditorState(newEditorState);
      }
      return null;
    }
    return getDefaultKeyBinding(e);
  };

  const toggleBlockType = (blockType: string) => {
    setEditorState(
      RichUtils.toggleBlockType(
        editorState,
        blockType
      )
    );
  };

  const toggleInlineStyle = (inlineStyle: string) => {
    setEditorState(
      RichUtils.toggleInlineStyle(
        editorState,
        inlineStyle
      )
    );
  };

  const handleChange = (newState: EditorState) => {
    setEditorState(newState);
    if (onChange) {
      const contentState = newState.getCurrentContent();
      const contentString = draftToMarkdown(convertToRaw(contentState));
      onChange(contentString);
    }
  };

  // If the user changes block type before entering any text, we can
  // either style the placeholder or hide it. Let's just hide it now.
  let className = 'RichEditor-editor';
  const contentState = editorState.getCurrentContent();
  if (!contentState.hasText()) {
    if (contentState.getBlockMap().first().getType() !== 'unstyled') {
      className += ' RichEditor-hidePlaceholder';
    }
  }

  const decoratorFactory = useRef(new DecoratorFactory()).current;
  const decorator = decoratorFactory.create(contentState, headlights);

  const newEditorState = EditorState.set(editorState, {
    decorator: decorator,
  });

  return (
    <div className="RichEditor-root">
      <BlockStyleControls
        editorState={editorState}
        onToggleBlock={toggleBlockType}
        onToggleInline={toggleInlineStyle}
        extraToolButtons={extraToolButtons}
      />
      <div className={className} onClick={focus}>
        <Editor
          blockStyleFn={getBlockStyle}
          customStyleMap={styleMap}
          editorState={newEditorState}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={mapKeyToEditorCommand}
          onChange={handleChange}
          ref={editor}
          spellCheck={true}
        />
      </div>
    </div>
  );
}

export default RichTextEditor;
