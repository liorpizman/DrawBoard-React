using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace draw_board.Classes
{
    /// <summary>
    /// Path which holds points, an ip address and a unique id 
    /// </summary>
    public class Path
    {
        public int id;
        public string ip;
        public Point[] pathPoints;

        /// <summary>
        /// Path constructor with points
        /// </summary>
        /// <param name="arr">all points</param>
        public Path(Point[] arr)
        {
            pathPoints = arr;
        }

        /// <summary>
        /// Path constructor with points, ip and unique id
        /// </summary>
        /// <param name="arr">all points</param>
        /// <param name="ip">ip address</param>
        /// <param name="id">unique id</param>
        public Path(Point[] arr, string ip, int id)
        {
            pathPoints = arr;
            this.ip = ip;
            this.id = id;
        }
    }
}
