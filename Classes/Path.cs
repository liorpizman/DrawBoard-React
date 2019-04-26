using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace draw_board.Classes
{
    public class Path
    {
        public int id;
        public string ip;
        public Point[] pathPoints;

        public Path(Point[] arr)
        {
            pathPoints = arr;
        }

        public Path(Point[] arr, string ip, int id)
        {
            pathPoints = arr;
            this.ip = ip;
            this.id = id;
        }
    }
}
