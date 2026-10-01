const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

const SUPABASE_URL = "https://ujdyqncsirsfyruauync.supabase.co";
const ANON_KEY = "sb_publishable_e82oSYkOtMyvyLn9uG_x1A_ZZkPf3pA";

// CORS全局配置
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,apikey");
  if(req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

// ========== 图片代理分支 ?img_url=xxx ==========
app.get('/', async (req, res) => {
  const imgUrl = req.query.img_url;
  const path = req.query.path;

  // 图片转发
  if(imgUrl){
    try{
      const decoded = decodeURIComponent(imgUrl);
      const imgResp = await fetch(decoded);
      const buf = await imgResp.buffer();
      res.set(Object.fromEntries(imgResp.headers));
      res.set("Access-Control-Allow-Origin","*");
      return res.send(buf);
    }catch(e){
      return res.status(500).json({error:"图片代理失败"});
    }
  }

  // 数据库API转发 ?path=rest/v1/xxx
  if(path){
    try{
      const targetUrl = `${SUPABASE_URL}/${path}`;
      const headers = {
        ...req.headers,
        apikey: ANON_KEY,
      };
      delete headers.host;
      const apiResp = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: ["POST","PATCH","PUT"].includes(req.method) ? JSON.stringify(req.body) : undefined
      });
      const data = await apiResp.text();
      res.status(apiResp.status).send(data);
    }catch(e){
      return res.status(504).json({error:"supabase请求超时",msg:e.message});
    }
    return;
  }

  return res.status(400).json({error:"缺少path或img_url参数"});
});

app.listen(port, ()=>{
  console.log(`Proxy running on port ${port}`);
})
