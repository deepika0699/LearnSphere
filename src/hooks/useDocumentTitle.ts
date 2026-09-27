/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${title} | LearnSphere`;
    return () => {
      document.title = originalTitle;
    };
  }, [title]);
}
