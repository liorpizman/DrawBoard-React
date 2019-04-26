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
        public void SendToAll(string boardname, JProperty p)
        {
            Path path = Controllers.BoardController.createPath(p);
            if (path != null)
            {
                Clients.All.SendAsync("sendToAll", boardname, path);
            }
        }
    }
}
