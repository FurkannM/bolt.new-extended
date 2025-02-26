import { useState } from 'react';
import { createScopedLogger } from '~/utils/logger';
import type { ModelConfig } from '~/utils/modelConstants';
import { useLocalStorage } from 'usehooks-ts';

const logger = createScopedLogger('usePromptEnhancement');

export function usePromptEnhancer() {
  const [enhancingPrompt, setEnhancingPrompt] = useState(false);
  const [promptEnhanced, setPromptEnhanced] = useState(false);
  const [systemPrompt, ] = useLocalStorage('system-prompt', 'extended-v1');

  const resetEnhancer = () => {
    setEnhancingPrompt(false);
    setPromptEnhanced(false);
  };

  const enhancePrompt = async (input: string, setInput: (value: string) => void, modelConfig: ModelConfig) => {
    setEnhancingPrompt(true);
    setPromptEnhanced(false);

    const response = await fetch('/api/enhancer', {
      method: 'POST',
      body: JSON.stringify({
        message: input,
        ...modelConfig,
        systemPromptId: systemPrompt,
      }),
    });

    const reader = response.body?.getReader();

    if (reader) {
      const decoder = new TextDecoder();

      let _input = '';
      let _error;

      try {
        setInput('');

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          _input += decoder.decode(value);

          logger.trace('Set input', _input);

          setInput(_input);
        }
      } catch (error) {
        _error = error;
        setInput(input);
      } finally {
        if (_error) {
          logger.error(_error);
        }

        setEnhancingPrompt(false);
        setPromptEnhanced(true);

        setTimeout(() => {
          setInput(_input);
        });
      }
    }
  };

  return { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer };
}
