var pad=5;

function formatHeap(heapInK) {
  return heapInK;
}

var appDataReady=new Promise(function (resolve,reject) {
  d3.csv("data.csv",resolve);
});

var hostDataReady=new Promise(function (resolve,reject) {
  d3.csv("hosts.csv",resolve);
});

Promise.all([appDataReady,hostDataReady]).then(function(data) {
  viz(data[0],data[1]);
});

function viz(rawAppData,hostData) {
  var width=800;
  var height=700;
  var hosts=[];
  hostData.forEach(function(d) {hosts.push(d.hostname)});

  var appData=d3.nest()
    .key(function(d) {return d.app})
    .key(function(d) {return d.service})
    .entries(rawAppData);

  var apps=d3.nest().key(function(d) {return d.app}).entries(rawAppData);
  var appNames=[];
  apps.forEach(function(d) {appNames.push(d.key)});

  d3.select("body").append("svg").attr("width",width).attr("height",height);

  var colScale=d3.scaleBand().domain(hosts).range([0,width]).padding(0.1);
  var rowScale=d3.scaleBand().domain(appNames).range([0,height]).padding(0.1);
  
  var serverGroups=d3.select("svg")
    .append("g")
    .classed("rootGroup",true)
    .selectAll(".serverG")
    .data(hosts)
    .enter()
    .append("g");

  serverGroups
    .append("rect")
    .attr("width",function(d) {return colScale.bandwidth()})
    .attr("height",height)
    .classed("serverG",true)

  serverGroups
    .append("text")
    .text(function(d) {return d})
    .attr("y",20)
    .classed("serverText",true);

  var appGroups=d3.select(".rootGroup").selectAll(".appG")
    .data(appData)
    .enter()
    .append("g")
    .classed("appGroup","true");

  appGroups
    .append("text")
    .text(function(d) {return d.key})
    .attr("y",20)
    .attr("transform","rotate(-90,20,20)")
    .classed("appText",true);

  appGroups
    .attr("transform",function(d) {
      return "translate(0,"+rowScale(d.key)+")";
    });

  var appRects=appGroups
    .append("rect")
    .classed("appG",true);

  var serviceGroup=appGroups
    .selectAll(".serviceG")
    .data(function(d) {return d.values})
    .enter()
    .append("g")
    .attr("transform",function(d,i) {
      return "translate(30,"+(pad+i*30+(i*pad))+")";
    })
    .classed("serviceG",true);

  serviceGroup
    .append("rect")
    .attr("width",width-30-10)
    .attr("height",30);

  serviceGroup
    .append("text")
    .text(function(d) {return d.key})
    .attr("transform","translate(0,20)")
    .classed("serviceText",true);

  serviceGroup
    .selectAll(".heap")
    .data(function(d) {return d.values})
    .enter()
    .append("text")
    .text(function(d) {return formatHeap(d.heap)})
    .attr("transform",function(d) {
      return "translate("+colScale(d.host)+",20)";
    })
    .classed("heap",true);

  appRects
    .attr("width",width)
    .attr("height",function(d) {
      return this.parentNode.getBBox().height+pad;
    });

  // work out the width of things
  // widest service name
  var serviceTextWidth=d3.selectAll(".serviceText")
    .nodes()
    .map(function(d) {
      return d.getBBox().width;
    })
    .reduce(function(a,b) {
      return a>b?a:b;
    });

  // move all the heap text over
  d3.selectAll(".heap")
    .attr("transform",function(d) {
      var f=colScale(d.host)+serviceTextWidth;
      return "translate("+f+",20)";
    });

  // move the server boxes over
  serverGroups
    .attr("transform",function(d) {
      var f=serviceTextWidth+colScale(d);
      return "translate("+f+",0)";
    });

  // make svg big enough
  var box=d3.select(".rootGroup").nodes()[0].getBBox();
  d3.select("svg").attr("width",box.width).attr("height",box.height);

  console.log(JSON.stringify(d3.cluster(d3.hierarchy(appData,function(d) {return d.values}))));
}
