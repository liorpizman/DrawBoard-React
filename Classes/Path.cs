using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace draw_board.Classes
{
    public class Path
    {
        public Point[] pathPoints;
        
        public Path(Point[] arr)
        {
            pathPoints = arr;
        }
    }
}
