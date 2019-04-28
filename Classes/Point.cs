using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace draw_board.Classes
{
    /// <summary>
    /// Point which contains x and y coordinates
    /// </summary>
    public class Point
    {
       public float x, y;

        /// <summary>
        /// Point constructor with x and y coordinates
        /// </summary>
        /// <param name="x">x coordinate</param>
        /// <param name="y">y coordinate</param>
        public Point(float x, float y)
        {
            this.x = x;
            this.y = y;
        }
    }
}
