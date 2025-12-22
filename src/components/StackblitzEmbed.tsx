import { useEffect, useRef } from 'react';
import sdk from '@stackblitz/sdk';

export const StackblitzEmbed = ({projectId}: { projectId: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (containerRef.current) {
      sdk.embedProjectId(containerRef.current, projectId, {
        clickToLoad: true,
        view: 'editor',
        height: 400,
      }).catch((error) => console.error(error));
    }
  }, [containerRef, projectId]);
  return <div ref={containerRef} className="aspect-video"/>;
};