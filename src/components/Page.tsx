import React from 'react';
import { Box } from '@mui/material';
import { useDrop } from 'react-dnd';

import Grid from './Grid';
import Module from './Module';
import { GUTTER_SIZE } from '../constants';
import ModulePositionInterface from '../types/ModulePositionInterface';
import { moduleW2LocalWidth, moduleX2LocalX, moduleY2LocalY } from '../helpers';

const Page = () => {
  const [modules] = React.useState([
    { id: 1, coord: { x: 1, y: 80, w: 2, h: 220 } },
    { id: 2, coord: { x: 4, y: 140, w: 2, h: 130 } },
    { id: 3, coord: { x: 7, y: 0, w: 3, h: 170 } },
  ]);

  const [modulePositions, setModulePositions] = React.useState(() => {
    let coordinates: ModulePositionInterface[] = [];
    for (let i = 0; i < modules.length; i++) {
      let module = modules[i];
      coordinates.push({
        id: module.id,
        top: moduleY2LocalY(module.coord.y),
        left: moduleX2LocalX(module.coord.x),
        right:
          moduleX2LocalX(module.coord.x) + moduleW2LocalWidth(module.coord.w),
        bottom: moduleY2LocalY(module.coord.y) + module.coord.h,
      });
    }
    return coordinates;
  });

  const containerRef = React.useRef<HTMLDivElement>();

  // Wire the module to DnD drag system
  const [, drop] = useDrop({ accept: 'module' });
  drop(containerRef);

  const generateContainerHeight = () =>
    Math.max(...modules.map(({ coord: { y, h } }) => y + h)) + GUTTER_SIZE * 2;

  const [containerHeight, setContainerHeight] = React.useState(
    generateContainerHeight,
  );

  return (
    <Box
      ref={containerRef}
      position="relative"
      width={1024}
      height={containerHeight}
      margin="auto"
      sx={{
        overflow: 'hidden',
        outline: '1px dashed #ccc',
        transition: 'height 0.2s',
      }}
    >
      <Grid height={containerHeight} />
      {modules.map((module) => (
        <Module
          key={module.id}
          data={module}
          modulePositions={modulePositions}
          setModulePositions={setModulePositions}
          setContainerHeight={setContainerHeight}
          defaultContainerHeight={generateContainerHeight()}
          // modules={modules}
        />
      ))}
    </Box>
  );
};

export default React.memo(Page);
