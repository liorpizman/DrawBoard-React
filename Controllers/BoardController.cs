using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using draw_board.Classes;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace draw_board.Controllers
{
    [Route("api/[controller]")]
    public class BoardController : Controller
    {

        db DB = new db();

        public static Path createPath(JProperty path) //JArray 
        {
            if (path != null)
            {
                Point[] arr = new Point[((JArray)path.First).Count];
                int i = 0;
                foreach (var item in path.First)
                {
                    float x = item["x"].ToObject<float>();
                    float y = item["y"].ToObject<float>();
                    arr[i++] = new Point(x, y);
                }

                return new Path(arr);
            }
            return null;
        }

        [HttpPost("[action]")]
        public void addPath([FromBody] JObject data)
        {
            if (data.Count != 3)
                return;
            Object path = data.First;
            Object boardData = ((JProperty)path).Next;
            Object ip = data.Last.ToString();
            string cIP = "default";
            try
            {
                cIP = ((string)ip).Split(' ')[1];
            }
            catch (Exception e)
            {
                e.StackTrace.ToString();
            }
            if (cIP.Equals("default"))
            {
                cIP = ip.ToString();
            }
            string boardName = ((JProperty)boardData).Value.ToString();
            if (path != null)
            {
                Path p = createPath((JProperty)path);
                DB.insertPath(p, boardName, cIP);
            }
        }

        [HttpPost("[action]")]                                     
        public Path[] getPath([FromBody] JObject boardname)
        {
            string board = ((JProperty)boardname.First).Value.ToString();
            Path[] paths = DB.getPath(board);
            return paths;
        }


        [HttpGet("[action]")]
        public Object getClientIp()
        {
            string ip = GetIpAddress();
            string IP = "";
            try
            {
                IP = GetIPAddress();
            }
            catch (Exception e)
            {
                e.StackTrace.ToString();
            }
            if (!String.IsNullOrEmpty(IP))
            {
                return IP.Replace(".", string.Empty);
            }
            return ip.Replace(".", string.Empty);
        }


        static string GetIPAddress()
        {
            String address = "";
            WebRequest request = WebRequest.Create("http://checkip.dyndns.org/");
            using (WebResponse response = request.GetResponse())
            using (System.IO.StreamReader stream = new System.IO.StreamReader(response.GetResponseStream()))
            {
                address = stream.ReadToEnd();
            }

            int first = address.IndexOf("Address: ") + 9;
            int last = address.LastIndexOf("</body>");
            address = address.Substring(first, last - first);

            return address;
        }


        public static string GetIpAddress()  // Get IP Address
        {
            string ip = "";
            IPHostEntry ipEntry = Dns.GetHostEntry(GetCompCode());
            IPAddress[] addr = ipEntry.AddressList;
            ip = addr[3].ToString();
            return ip;
        }

        public static string GetCompCode()  // Get Computer Name
        {
            string strHostName = "";
            strHostName = Dns.GetHostName();
            return strHostName;
        }

    }
}
