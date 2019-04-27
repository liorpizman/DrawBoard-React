using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using draw_board.Classes;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json.Linq;

namespace draw_board
{
    /// <summary>
    /// Socket provides methods that communicate with SignalR connections that connected to a Hub.
    /// </summary>
    public class socket : Hub
    {
        /// <summary>
        /// Updates all users that a new path was created on the draw board
        /// </summary>
        /// <param name="boardname">draw board name</param>
        /// <param name="p">new path</param>
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

        /// <summary>
        ///  Updates all users that a path was deleted from the draw board
        /// </summary>
        /// <param name="boardname">draw board name</param>
        /// <param name="id">path unique id</param>
        public void removePath(string boardname, int id)
        {
            Clients.All.SendAsync("removePath", boardname, id);
        }
    }
}
