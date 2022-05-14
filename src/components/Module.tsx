import React from 'react';
import { Box } from '@mui/material';
import { useDrag, useDragDropManager } from 'react-dnd';
import { useRafLoop } from 'react-use';

import ModuleInterface from '../types/ModuleInterface';
import {
  localX2ModuleX,
  moduleW2LocalWidth,
  moduleX2LocalX,
  moduleY2LocalY,
} from '../helpers';
import { CONTAINER_WIDTH, GUTTER_SIZE } from '../constants';
import ModuleBottomInterface from '../types/ModulePositionInterface';
import PreviousMovementInterface from '../types/PreviousMovementInterface';
import ModulePositionInterface from '../types/ModulePositionInterface';

type ModuleProps = {
  data: ModuleInterface;
  modulePositions: ModulePositionInterface[];
  setModulePositions: CallableFunction;
  setContainerHeight: CallableFunction;
  defaultContainerHeight: number;
  // modules: ModuleInterface[];
};

const Module = (props: ModuleProps) => {
  const {
    data: {
      id,
      coord: { x, y, w, h },
    },
    modulePositions,
    setModulePositions,
    setContainerHeight,
    defaultContainerHeight,
    // modules,
  } = props;

  // Transform x, y to left, top
  // This top and left are dynamic, changes with drag
  const [{ top, left }, setPosition] = React.useState(() => ({
    top: moduleY2LocalY(y),
    left: moduleX2LocalX(x),
  }));

  const initialPosition = React.useRef<{ top: number; left: number }>();

  const [
    { isMovingUp, isMovingDown, isMovingLeft, isMovingRight },
    setMovingDirection,
  ] = React.useState({
    isMovingUp: false,
    isMovingDown: false,
    isMovingLeft: false,
    isMovingRight: false,
  });

  const [{ prevXMovement, prevYMovement }, setPreviousMovement] =
    React.useState<PreviousMovementInterface>({
      prevXMovement: null,
      prevYMovement: null,
    });

  const dndManager = useDragDropManager();
  // Use request animation frame to process dragging
  const [stop, start] = useRafLoop(() => {
    const movement = dndManager.getMonitor().getDifferenceFromInitialOffset();
    if (!initialPosition.current || !movement) {
      return;
    }
    const item = dndManager.getMonitor().getItem();

    let yMovement = movement.y;
    let xMovement = movement.x;

    // If have previous and check got, compare to now
    if (prevXMovement && prevYMovement) {
      setMovingDirection({
        isMovingUp: prevYMovement > yMovement,
        isMovingDown: prevYMovement < yMovement,
        isMovingLeft: prevXMovement > xMovement,
        isMovingRight: prevXMovement < xMovement,
      });
    }

    // After compare set to prev
    setPreviousMovement({
      prevXMovement: xMovement,
      prevYMovement: yMovement,
    });

    let initialTop = item.position.top;
    let initialLeft = item.position.left;
    let width = moduleW2LocalWidth(props.data.coord.w);
    let initialRight = item.position.left + width;
    let height = props.data.coord.h;
    let bottom = top + height;
    let right = left + width;

    //#region Snap to top, left, right feature
    if (yMovement < 0) {
      if (initialTop + yMovement < GUTTER_SIZE) {
        yMovement = -(initialTop - GUTTER_SIZE);
      }
    }

    if (xMovement > 0) {
      if (initialLeft + width + xMovement + GUTTER_SIZE > CONTAINER_WIDTH) {
        xMovement = CONTAINER_WIDTH - initialLeft - width - GUTTER_SIZE;
      }
    } else if (xMovement < 0) {
      if (initialLeft + xMovement < GUTTER_SIZE) {
        xMovement = -initialLeft + GUTTER_SIZE;
      }
    }
    //#endregion

    //#region Snappy x movement feature
    const snappyXMovement = () => {
      return (
        moduleX2LocalX(localX2ModuleX(initialLeft + xMovement)) - initialLeft
      );
    };
    xMovement = snappyXMovement();
    //#endregion

    // If moving, then set position
    if (isMovingUp || isMovingDown || isMovingLeft || isMovingRight) {
      for (let i = 0; i < modulePositions.length; i++) {
        if (modulePositions[i].id === id) continue;
        let module = modulePositions[i];
        let moduleTop = module.top;
        let moduleLeft = module.left;
        let moduleRight = module.right;
        let moduleBottom = module.bottom;
        let moduleWidth = Math.abs(moduleLeft - moduleRight);

        let horizontalMiddlePoint = (left + right) / 2;
        let verticalMiddlePoint = (top + bottom) / 2;
        let moduleMiddlePoint = (moduleLeft + moduleRight) / 2;

        const checkIfHorizontalWithin = () => {
          if (
            // moduleLeft | * | moduleRight
            (moduleLeft < horizontalMiddlePoint &&
              horizontalMiddlePoint < moduleRight) ||
            // If my left outside, but right is in
            (left < moduleLeft && right > moduleLeft) ||
            //If my right outside, but left is in
            (right > moduleRight && left < moduleRight)
          ) {
            return true;
          }
          return false;
        };

        const checkIfVerticalWithin = () => {
          if (
            // moduleTop | * | moduleBottom
            (moduleTop < verticalMiddlePoint &&
              verticalMiddlePoint < moduleBottom) ||
            // If my up outside, but bottom is in
            (top < moduleTop && bottom > moduleTop) ||
            // If my bottom outside, but top is in
            (bottom > moduleBottom && top < moduleBottom)
          ) {
            return true;
          }
          return false;
        };

        const checkProjectedXMovement = () => {
          let attemptXMovement = -(initialLeft - moduleRight - GUTTER_SIZE);
          let projectedLeft = left + attemptXMovement;
          let projectedRight = right + attemptXMovement;

          let okayToMove: boolean = true;

          const checkCollision = (
            bodyA: ModulePositionInterface,
            bodyB: ModulePositionInterface,
          ): boolean => {
            return !(
              bodyA.bottom < bodyB.top ||
              bodyA.top > bodyB.bottom ||
              bodyA.right < bodyB.left ||
              bodyA.left > bodyB.right
            );
          };
          console.log('One try');

          let collidedModules = modulePositions.filter((position) => {
            return checkCollision(position, { top, left, bottom, right });
          });

          for (let j = 0; j < collidedModules.length; j++) {
            if (collidedModules[j].id === id) continue;
            let testModule = collidedModules[j];
            let testModuleTop = testModule.top;
            let testModuleLeft = testModule.left;
            let testModuleRight = testModule.right;

            // If after move
            if (
              // New left - Gutter is less than Right, fail
              projectedLeft - GUTTER_SIZE < testModuleRight &&
              // New right + Gutter is out of screen, fail
              projectedRight + GUTTER_SIZE > CONTAINER_WIDTH
            ) {
              okayToMove = false;
            }
            console.log({
              newLeft: projectedLeft - GUTTER_SIZE < testModuleRight,
            });
            console.log('okayToMove', okayToMove);
            return okayToMove;
          }
        };

        if (
          // Target bottom is higher, target top is higher
          (moduleBottom < top || moduleTop < top) &&
          // Top is touching target bottom
          initialTop + yMovement - GUTTER_SIZE < moduleBottom &&
          // If I am horizontally in range
          checkIfHorizontalWithin()
        ) {
          // console.log({
          //   first: moduleBottom < top || moduleTop < top,
          //   second: initialTop + yMovement - GUTTER_SIZE < moduleBottom,
          // });
          // console.log({
          //   moduleBottom,
          //   top,
          //   moduleTop,
          // });
          // console.log('do this');

          //When I do this, top never changes, why?
          //Initial top never changes
          //Module Bottom never changes
          //Gutter size never changes
          yMovement = -(initialTop - moduleBottom - GUTTER_SIZE);
        }

        if (
          // Target left is bigger, target right is bigger
          (moduleLeft > right || moduleRight > right) &&
          // Right is touching target left
          initialRight + xMovement - GUTTER_SIZE > moduleLeft &&
          // If I am vertically in range
          checkIfVerticalWithin() &&
          // If after movement all clear
          checkProjectedXMovement()
        ) {
          xMovement = -(initialLeft - moduleRight - GUTTER_SIZE);
        }
      }

      // Bottom extend feature
      setContainerHeight(
        Math.max(
          ...modulePositions
            .filter((module) => {
              return module.id !== id;
            })
            .map((module) => {
              return module.bottom;
            }),
          defaultContainerHeight,
          bottom,
        ),
      );

      // console.log('y when set', yMovement);

      // Update new position of the module
      setPosition({
        top: initialPosition.current.top + yMovement,
        left: initialPosition.current.left + xMovement,
      });
    }
  }, false);

  // Wire the module to DnD drag system
  const [, drag] = useDrag(
    () => ({
      type: 'module',
      item: () => {
        // Track the initial position at the beginning of the drag operation
        initialPosition.current = { top, left };

        // Start raf
        start();
        return {
          id,
          position: {
            top,
            left,
          },
        };
      },
      end: () => {
        stop();
        setModulePositions(
          modulePositions.map((module) => {
            if (module.id === id) {
              return {
                id,
                top,
                left,
                right: left + moduleW2LocalWidth(props.data.coord.w),
                bottom: top + props.data.coord.h,
              };
            } else {
              return module;
            }
          }),
        );
      },
    }),
    [top, left],
  );

  return (
    <Box
      ref={drag}
      display="flex"
      position="absolute"
      border={1}
      borderColor="grey.500"
      padding="10px"
      bgcolor="rgba(0, 0, 0, 0.5)"
      top={top}
      left={left}
      width={moduleW2LocalWidth(w)}
      height={h}
      sx={{
        transitionProperty: 'top, left',
        transitionDuration: '0.1s',
        '& .resizer': {
          opacity: 0,
        },
        '&:hover .resizer': {
          opacity: 1,
        },
      }}
    >
      <Box
        flex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize={40}
        color="#fff"
        sx={{ cursor: 'move' }}
        draggable
      >
        <Box sx={{ userSelect: 'none', pointerEvents: 'none' }}>{id}</Box>
      </Box>
    </Box>
  );
};

export default React.memo(Module);
