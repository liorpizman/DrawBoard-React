using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;

namespace draw_board.Classes
{
    public class db
    {
        public string connectionString = "Data Source=DESKTOP-QUEN7BL\\SQLEXPRESS;Initial Catalog=draws;Integrated Security=True";
        public SqlConnection conn;
        public db()
        {
            conn = new SqlConnection(connectionString);
        }

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

        public void insertPoint(Point p, int pathId)
        {
            //if()
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
