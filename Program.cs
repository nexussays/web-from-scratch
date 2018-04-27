using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace web
{
   public class Program
   {
      public static void Main(string[] args)
      {
         BuildWebHost(args).Run();
      }

      public static IWebHost BuildWebHost(string[] args) =>
         WebHost.CreateDefaultBuilder(args)
         .UseStartup<Startup>()
         .Build();
   }

   public class Startup
   {
      public Startup(IConfiguration configuration)
      {
         Configuration = configuration;
      }

      public IConfiguration Configuration { get; }

      public void Configure(IApplicationBuilder app, IHostingEnvironment env)
      {
         app.UseStaticFiles();
         app.Run(context =>
         {
            var content = File.ReadAllText(Directory.GetCurrentDirectory() + @"\wwwroot\index.html");
            content = content.Replace("./", "/");
            context.Response.Headers.Add("Content-Type", "text/html");
            context.Response.Headers.Add("Content-Length", content.Length.ToString());
            return context.Response.WriteAsync(content);
         });
      }
   }
}
