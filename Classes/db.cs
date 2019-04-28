using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;

namespace draw_board.Classes
{
    /// <summary>
    /// db class to manage queries on sql server
    /// </summary>
    public class db
    {
        public string connectionString = "Data Source=DESKTOP-QUEN7BL\\SQLEXPRESS;Initial Catalog=draws;Integrated Security=True";
        public SqlConnection conn;

        /// <summary>
        /// db constructor for creating a new connection
        /// </summary>
        public db()
        {
            conn = new SqlConnection(connectionString);
        }

        /// <summary>
        /// Delete a path from the database based on a unique identifier
        /// </summary>
        /// <param name="pathId">path unique identifier</param>
        public void deletePathFromDB(int pathId)
        {
            using (SqlConnection openCon = new SqlConnection(connectionString))
            {
                string deletePath = " DELETE FROM boardpath WHERE path =@path";

                using (SqlCommand query = new SqlCommand(deletePath))
                {
                    query.Connection = openCon;
                    query.Parameters.Add("@path", SqlDbType.Int).Value = pathId;
                    openCon.Open();
                    query.ExecuteNonQuery();
                }
            }
        }

        /// <summary>
        /// Adds a new path to the database for a board and ip address 
        /// </summary>
        /// <param name="pa">new path</param>
        /// <param name="boardName">current draw board</param>
        /// <param name="ip">client's ip</param>
        /// <returns>unique id of path</returns>
        public int insertPath(Path pa, string boardName, string ip)
        {
            insertBoard(boardName);
            int pathId = insertIp(ip, boardName);
            foreach (Point p in pa.pathPoints)
            {
                if (p != null)
                    insertPoint(p, pathId);
            }
            return pathId;
        }

        /// <summary>
        /// Receive all paths for a given board from the database
        /// </summary>
        /// <param name="boardName">given draw board</param>
        /// <returns>all paths</returns>
        public Path[] getPath(string boardName)
        {
            using (SqlConnection openCon = new SqlConnection(connectionString))
            {
                string getPaths = "SELECT path,ip From boardpath where boardname =@boardname";
                using (SqlCommand query = new SqlCommand(getPaths))
                {
                    query.Connection = openCon;
                    query.Parameters.Add("@boardname", SqlDbType.NChar).Value = boardName;
                    openCon.Open();
                    DbDataReader reader = query.ExecuteReader();
                    List<Path> paths = new List<Path>();
                    int i = 0;

                    while (reader.Read())
                    {
                        var pathId = Int32.Parse(reader["path"].ToString());
                        var pathIp = reader["ip"].ToString().Replace("  ", "");
                        Point[] points = getPointsOfPath(pathId);
                        Path path = new Path(points, pathIp, pathId);
                        paths.Insert(i++, path);
                    }
                    return paths.ToArray();
                }
            }
        }

        /// <summary>
        /// Receive all points for a given path from the database
        /// </summary>
        /// <param name="path">path id</param>
        /// <returns>all points</returns>
        public Point[] getPointsOfPath(int path)
        {
            using (SqlConnection openCon = new SqlConnection(connectionString))
            {
                List<Point> points = new List<Point>();
                string getPaths = "SELECT x,y From pathinfo where path =@path";
                using (SqlCommand query = new SqlCommand(getPaths))
                {
                    query.Connection = openCon;
                    query.Parameters.Add("@path", SqlDbType.Int).Value = path;
                    openCon.Open();
                    DbDataReader reader = query.ExecuteReader();
                    int i = 0;
                    while (reader.Read())
                    {
                        float x = float.Parse(reader["x"].ToString());
                        float y = float.Parse(reader["y"].ToString());
                        Point p = new Point(x, y);
                        points.Insert(i++, p);
                    }
                    return points.ToArray();
                }
            }
        }

        /// <summary>
        /// Insert a new draw board into the database
        /// </summary>
        /// <param name="boardName">new draw board</param>
        public void insertBoard(string boardName)
        {
            using (SqlConnection openCon = new SqlConnection(connectionString))
            {
                string insertBoard = " If Not Exists (select * from boards where boardname=@boardname) INSERT into boards (boardname) VALUES (@boardname)";

                using (SqlCommand query = new SqlCommand(insertBoard))
                {
                    query.Connection = openCon;
                    query.Parameters.Add("@boardname", SqlDbType.NChar).Value = boardName;
                    openCon.Open();
                    query.ExecuteNonQuery();
                }
            }
        }

        /// <summary>
        /// Insert a new path record based on the draw board name and ip address
        /// </summary>
        /// <param name="ip">ip address</param>
        /// <param name="boardName">draw board name</param>
        /// <returns>path id</returns>
        public int insertIp(string ip, string boardName)
        {
            using (SqlConnection openCon = new SqlConnection(connectionString))
            {
                string insertIp = "INSERT into boardpath (boardname,ip) VALUES (@boardname,@ip) SELECT SCOPE_IDENTITY()";

                using (SqlCommand query = new SqlCommand(insertIp))
                {
                    query.Connection = openCon;
                    query.Parameters.Add("@boardname", SqlDbType.NChar).Value = boardName;
                    query.Parameters.Add("@ip", SqlDbType.NChar).Value = ip;
                    openCon.Open();
                    int pathid = Int32.Parse(query.ExecuteScalar().ToString());
                    return pathid;
                }
            }
        }

        /// <summary>
        /// Insert a new point for a given path to the database
        /// </summary>
        /// <param name="p">given point</param>
        /// <param name="pathId">path id</param>
        public void insertPoint(Point p, int pathId)
        {
            using (SqlConnection openCon = new SqlConnection(connectionString))
            {
                string insertPoint = "INSERT into pathinfo (path,x,y) VALUES (@path,@x,@y)";

                using (SqlCommand query = new SqlCommand(insertPoint))
                {
                    query.Connection = openCon;
                    query.Parameters.Add("@path", SqlDbType.Int).Value = pathId;
                    query.Parameters.Add("@x", SqlDbType.Float).Value = p.x;
                    query.Parameters.Add("@y", SqlDbType.Float).Value = p.y;
                    openCon.Open();
                    query.ExecuteNonQuery();
                }
            }
        }
    }
}
