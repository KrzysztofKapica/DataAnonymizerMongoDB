/**
* @param {{ upper_left:{x:number,y:number},
*           lower_right:{x:number,y:number} }} rect
* @returns {{ upper_left:{x:number,y:number},
*             lower_right:{x:number,y:number} }}
*/

export function roundRectangleCoordinates(rect) {
    return {
      upper_left: {
        x: Math.floor(rect.upper_left.x),
        y: Math.floor(rect.upper_left.y),
      },
      lower_right: {
        x: Math.floor(rect.lower_right.x),
        y: Math.floor(rect.lower_right.y),
      },
    };
  }
  