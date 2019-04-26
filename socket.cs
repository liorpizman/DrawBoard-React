using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using draw_board.Classes;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json.Linq;

namespace draw_board
{
    public class socket : Hub
    {
        public void SendToAll(string boardname, JObject p)
        {
            JArray points = p["points"] as JArray;
            Path path = Controllers.BoardController.createPath(points);
            string ip = p["details"]["ip"].ToObject<string>();
            int id = p["details"]["id"].ToObject<int>();
            path.id = id;
            path.ip = ip;
            Clients.All.SendAsync("sendToAll", boardname, path);
        }

        public void removePath(string boardname, int id)
        {
            Clients.All.SendAsync("removePath", boardname, id);
        }
    }
}
