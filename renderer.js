var Renderer = function (canvas) {
    
	var canvas = $(canvas).get(0);
	var dom = $(canvas);
	var ctx = canvas.getContext("2d");
	ctx.textAlign = "center";

	var particleSystem = null;

	var that = {
		init : function (system) {
			// save a reference to the particle system for use in the .redraw() loop
			particleSystem = system;

            sys.screen({size:{width:dom.width(), height:dom.height()}});

            $(window).resize(that.resize)
            that.resize()
            that.initMouseHandling()

		},

		resize:function(){
            canvas.width = $(window).width()-50;
            canvas.height = $(window).height()-60;
            sys.screen({size:{width:dom.width(), height:dom.height()}})
            that.redraw();
        },

		redraw : function () {
		    ctx.save();
            ctx.setTransform(1,0,0,1,0,0);
            ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
            ctx.restore();

			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, dom.width(), dom.width());

			particleSystem.eachEdge(function (edge, pt1, pt2) {
				BuildEdge(ctx, edge, pt1, pt2);
			});

			particleSystem.eachNode(function (node, pt) {
				BuildNode(ctx,node,pt);
			});
		},

		initMouseHandling : function () {
			// no-nonsense drag and drop (thanks springy.js)
			var dragged = null;

			// set up a handler object that will initially listen for mousedowns then
			// for moves and mouseups while dragging
			var left, right;
			left = 0;
			right = 2;
			
			var handler = {


				moved : function (e) {

                    var pos = $(canvas).offset();
					_mouseP = arbor.Point(e.pageX - pos.left, e.pageY - pos.top)
					nearest = particleSystem.nearest(_mouseP);
					if (!nearest.node) {
						return false;
					} else {
						sys.eachEdge(function(edge) {
							edge.data.highlight=false;
						});

						selected = (nearest.distance < 50) ? nearest : null
						if (selected) {
							nearest.node.data.highlight=true;
							var edgesTo = sys.getEdgesFrom(nearest.node);
							for (index in edgesTo) {
								edgesTo[index].data.highlight=true;
							}
							var edgesTo = sys.getEdgesTo(nearest.node);
							for (index in edgesTo) {
								edgesTo[index].data.highlight=true;
							}
							//ShowDetail(selected);
						} else {
							//HideDetail();
						}
						
						that.redraw();
	
					}
					

					return false
				},

				mousedown : function (e) {
					if (e.button === left) {
						var pos = $(this).offset();
						selected = (nearest.distance < 50) ? nearest : null
						if (selected) {
							selected = nearest = dragged = particleSystem.nearest(p);
	
							if (selected.node !== null) {
								dragged.node.fixed = true;
							}
						}
					}
					return false;
				},

				clicked : function (e) {

					var pos = $(canvas).offset();
					_mouseP = arbor.Point(e.pageX - pos.left, e.pageY - pos.top)
					nearest = particleSystem.nearest(_mouseP);
					if (nearest.distance > 50) return;
					if (e.button === left) {

						dragged=nearest;
						nearest.node.data.selected=!nearest.node.data.selected;
						if (nearest && nearest.node !== null) {
							// while we're dragging, don't let physics move the node
							nearest.node.fixed = true;
						}

						$(canvas).bind('mousemove', handler.dragged);
						$(window).bind('mouseup', handler.dropped);
					} else {

						nSelected = 0;
						sys.eachNode(function(node,pt) {
							if (node.data.selected) {
								nSelected++;
							}
						});
						console.log(nSelected);
						if (nSelected>0) {
							$(function(){
								$.contextMenu({
									selector: '#viewport', 
									trigger: 'none',
									delay: 500,
									autoHide: true,
									build: function($trigger, e) {
										var menu = {};
										console.log(nSelected);
										if (nSelected == 1) {
											var addMenu = {
												"drilldown" : {name: "Drilldown"},
/*
												"sep1" : "---------",
												"collapse" : {name: "Collapse"}
*/
											}
											$.extend(true,menu,addMenu);
										}
										if (nSelected >= 1) {
											var addMenu = {
												"sep2": "---------",
												"expand": {name: "Expand Selected"},
												"sep3": "---------",
												"remove": {name: "Remove Selected From Diagram"}
											}
											$.extend(true,menu,addMenu);
										};
/*
										if (nSelected >= 0) {
											var addMenu = {
												"sepSave": "---------",
												"save": {name: "Save Graph"},
											}
											$.extend(true,menu,addMenu);
										};
*/
										return {
											callback: function(key, options) {
												console.log("Key: " + key);
												console.log("options: " + options);
												switch(key) {
													case "drilldown":
														window.open(deepLinks[nearest.node.data.entityType].replace("******",nearest.node.name));
														break;
													case "expand":
														var expansionString = "";
														sys.eachNode(function(node,pt) {
															if (node.data.selected) {
																expansionString = node.name;
																process(expansionString);
															}
														});
														break;
													case "collapse":
														//debugger;
														// from this node delete all nodes
														//	connected to this one
														//  which have only one edge to or from them
														var thisNode=nearest.node;
														var connectedNodesFromThisNode = new Array();
														var edgesFrom = sys.getEdgesFrom(thisNode);
														var nTotalConnectedNodes
														for (index in edgesFrom) {
															connectedNodesFromThisNode.push(edgesFrom[index].target);
														}
														var edgesTo = sys.getEdgesTo(thisNode)
														for (index in edgesTo) {
															connectedNodesFromThisNode.push(edgesTo[index].source);
														}
														for (index in connectedNodesFromThisNode) {
															nTotalConnectedNodes=sys.getEdgesFrom(connectedNodesFromThisNode[index]).length;
															nTotalConnectedNodes+=sys.getEdgesTo(connectedNodesFromThisNode[index]).length;
															if (nTotalConnectedNodes == 1) {
																sys.pruneNode(connectedNodesFromThisNode[index]);
															}
														}
														break;
													case "remove":
														sys.eachNode(function(node,pt){
															if (node.data.selected) {
																sys.pruneNode(node);
															}
														});
														break;
													case "save":
														var saveObj = {nodes:{}, links:{}}
														sys.eachNode(function(node,pt){
															saveObj.nodes[node.data.record.id] = node.data.record;
														});
														sys.eachEdge(function(edge,pt1, pt2){
															//debugger;
															saveObj.links[edge.data.record.id] = edge.data.record;
														});
														
														console.log(saveObj);
														save(saveObj);
														break;
														
												}
												sys.eachNode(function(node,pt) {
													if (node.data.selected) {
														node.data.selected=false;
													}
												});
											},
											items: menu
										};
									}
								});
							});
							$('#viewport').contextMenu( {x: _mouseP.x, y: _mouseP.y + pos.top} );
						}
					}
					return false;
					
				},
				dragged : function (e) {
					var pos = $(canvas).offset();
					var s = arbor.Point(e.pageX - pos.left, e.pageY - pos.top);

					if (dragged && dragged.node !== null) {
						var p = particleSystem.fromScreen(s);
						dragged.node.p = p;
					}

					return false;
				},

				dropped : function (e) {
					if (dragged === null || dragged.node === undefined)
						return;
					if (dragged.node !== null)
						dragged.node.fixed = false;
					dragged.node.tempMass = 1000;
					dragged = null;
					$(canvas).unbind('mousemove', handler.dragged);
					$(window).unbind('mouseup', handler.dropped);
					_mouseP = null;
					return false;
				},
				
				left : function (e) {
					$(".detailBreakout").hide();
				},
				
				zoom : function (e,delta) {
                    var pos = $(canvas).offset();
					factor = e.originalEvent.wheelDelta >0?1.10:0.9
				    ctx.translate((e.pageX - pos.left), (e.pageY - pos.top));
                    ctx.scale(factor,factor);
                    ctx.translate(-(e.pageX - pos.left), -(e.pageY - pos.top));
					that.redraw();
					return false;
				},

                dblclicked: function(e) {
                    var pos = $(canvas).offset();
					_mouseP = arbor.Point(e.pageX - pos.left, e.pageY - pos.top)
					nearest = particleSystem.nearest(_mouseP);
					var entityString = nearest.node.name;
					process(entityString);
                }
			};

			// start listening
			$(canvas).dblclick(handler.dblclicked);
			$(canvas).mousedown(handler.clicked);
			$(canvas).mousemove(handler.moved);
			$(canvas).mouseout(handler.left);
			$(canvas).bind("mousewheel", handler.zoom)
		}
	};
	return that;

};

function Line(x1,y1,x2,y2){
    this.x1=x1;
    this.y1=y1;
    this.x2=x2;
    this.y2=y2;
}

Line.prototype.drawWithArrowheads=function(ctx){
    // arbitrary styling


    // draw the line
    ctx.beginPath();
    ctx.moveTo(this.x1,this.y1);
    ctx.lineTo(this.x2,this.y2);
    ctx.stroke();

    xp = (this.x2-this.x1)/100;
    yp = (this.y2-this.y1)/100;
    
    var direction=Math.atan((this.y2-this.y1)/(this.x2-this.x1));
    direction+=((this.x2>this.x1)?90:-90)*Math.PI/180;
    // draw the starting arrowhead
    this.drawArrowhead(ctx,this.x1+xp*27,this.y1+yp*27,direction);
    // draw the ending arrowhead
    this.drawArrowhead(ctx,this.x2-xp*25,this.y2-yp*25,direction);
}

Line.prototype.drawArrowhead=function(ctx,x,y,radians){
    ctx.save();
    ctx.beginPath();
    ctx.translate(x,y);
    ctx.rotate(radians);
    ctx.moveTo(0,0);
    ctx.lineTo(3,7);
    ctx.lineTo(-3,7);
    ctx.closePath();
    ctx.restore();
    ctx.fill();
}

function BuildEdge (ctx, edge, pt1, pt2) {
	var w = 25;
	var line = new Line(pt1.x, pt1.y, pt2.x, pt2.y);
	ctx.strokeStyle = "rgba(0,0,0,0.15)";
	ctx.lineWidth = 1;
	if (edge.data.highlight) { 
		ctx.strokeStyle = "rgba(0,0,0,0.45)";
		ctx.lineWidth = 1;
	}
    ctx.fillStyle="rgba(0,0,0,0.35)";
    
    line.drawWithArrowheads(ctx);
/*
	ctx.strokeStyle = "rgba(0,0,0,0.15)";
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(pt1.x, pt1.y);
	ctx.lineTo(pt2.x, pt2.y);
	ctx.stroke();
*/
	if (!!edge.data.label) {
		ctx.fillStyle = "#666666"; //grey
		ctx.font = 'italic 10px arial';
	    var labelWidth = ctx.measureText(edge.data.label).width;
	    var commentWidth = ctx.measureText(edge.data.comment).width;
	    var boxWidth = 10 + (labelWidth>commentWidth?labelWidth:commentWidth);
	    var boxHeight = 25;
	    ctx.clearRect((pt1.x + pt2.x) / 2 - boxWidth/2, (pt1.y + pt2.y) / 2 -boxHeight/2, boxWidth, boxHeight);
		ctx.fillText(edge.data.label, (pt1.x + pt2.x) / 2, ((pt1.y + pt2.y) / 2) -5 );
		if (edge.data.comment)	ctx.fillText(edge.data.comment, (pt1.x + pt2.x) / 2, ((pt1.y + pt2.y) / 2) + 5);
	}
}

function BuildNode (ctx, node,pt) {
	var partyType = node.data.entityType || "";
	var partyTypeLabel = "";

	var imageWidth = 32;
	var iconWidth = 15;
	var textDistance = 35;
	var textColor = "#555";
    var strokeColor = "#000"

	if (node.data.selected) {
		ctx.fillStyle="rgba(0,0,0,0.1)";
		ctx.fillRect(pt.x-30, pt.y-30, 60,60)
	}

	ctx.textAlign="center";
	ctx.textBaseline = 'middle';
    
    // icon
    ctx.font = "48px FontAwesome";
    var textWidth = ctx.measureText(iconMap[partyType].icon).width;
    var textHeight = ctx.measureText(iconMap[partyType].icon).width;
	ctx.fillStyle = iconMap[partyType].color;
    ctx.fillText(iconMap[partyType].icon, pt.x, pt.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.5;
    ctx.strokeText(iconMap[partyType].icon, pt.x, pt.y);
	
    // label			
	ctx.font = 'bold 15px arial';
	ctx.fillStyle = textColor;
	
	ctx.fillText(node.data.label + partyTypeLabel, pt.x, pt.y + textDistance);

    $.each(node.data.record, function(item,value) {
		if (item.match("icon")) {
			var xOffset
			var yOffset;
			var facetIcon = item.split("-")[2];
			if		(item.match("-tr-")) {xOffset =   textWidth	; yOffset = -textHeight/2}
			else if (item.match("-tl-")) {xOffset =  -textWidth	; yOffset = -textHeight/2}
			else if (item.match("-bl-")) {xOffset =  -textWidth	; yOffset =  textHeight/2}
			else if (item.match("-br-")) {xOffset =   textWidth ; yOffset =  textHeight/2}
			ctx.fillStyle = "#555";
            ctx.font = "15px FontAwesome";
			ctx.fillStyle = iconMap[facetIcon][node.data.record[item]].color;
            ctx.fillText(iconMap[facetIcon][node.data.record[item]].icon, pt.x + xOffset, pt.y + yOffset);
		}
	});
}

function toTitleCase(str) {
    return str.replace(/(?:^|\s)\w/g, function(match) {
        return match.toUpperCase();
    });
};

function ShowDetail (selected) {
	var record = JSON.parse(JSON.stringify(selected.node.data.record));

	delete record.endNode;
	delete record.catType;
	delete record.shown;
	delete record.xPos;
	delete record.yPos;

	var strHtml = "<div class=dbContainer>";
	strHtml += "<div class='dbInfoPane'>";
	strHtml += "	<div class='dbTitle'>" + selected.node.data.label + "</div>";
	strHtml += "	<div class='dbDetail'>";
	for (data in record) {
		title = data;
		if (title!="entityTitle" && title!="label") {
			if (title.match("-")) title = title.split(/.*-/)[1];
			strHtml += "	<div class='db"+title+"'>" + toTitleCase(title.split(/(?=[A-Z])/).join(" ")) + " : " + record[data] + "</div>";
		}
	}
	strHtml += "	</div>";
	strHtml += "</div>";
	strHtml += "<div class='dbImage "+selected.node.data.entityType+"'></div>";
	strHtml += "</div>";
	
	
	var minDrawFromTop = 35;
	var heightAboveIcon = 40;
	var distanceFromRight = 30;
	$(".detailBreakout")
	.html(strHtml)
	.css("top", $("#viewport").position().top+nearest.screenPoint.y-heightAboveIcon<minDrawFromTop?minDrawFromTop:$("#viewport").position().top+nearest.screenPoint.y-heightAboveIcon)
	.css("left", nearest.screenPoint.x+$(".detailBreakout").outerWidth()+distanceFromRight>screen.availWidth?screen.availWidth-$(".detailBreakout").outerWidth()-distanceFromRight:nearest.screenPoint.x)
	.show();
//			.fadeIn({easing: "easeInQuart"});
}

function HideDetail  () {
	$(".detailBreakout").hide()
}
	
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var rightMargin = 53;
var sys;
var callingBS = false;
var zoom = 0;
var nSelected;
var iconTypes = new Array();
var icons=getParameterByName("icons");

var first=true;

var iconMap = icons!=""?JSON.parse(icons):{
    PERSON: {
        icon: "\uf007",
        color: "#999"
    },
    ORGANIZATION: {
        icon: "\uf1ad",
        color: "#999"
    },
    GROUP: {
        icon: "\uf0c0",
        color: "#999"
    },
    Gender: {
        "M": {
            icon: "\uf222",
            color: "#999"
        },
        "F": {
            icon: "\uf221",
            color: "#999"
        }
    },
    Expand: {
        "Y": {
          icon: "\uf047"
        }
    }
};

function init(defaultNode) {
	sys = null;
	sys = arbor.ParticleSystem(1500, 600, 0.69, false, 2000);
//			sys = arbor.ParticleSystem(1000, 600, 1,false,195,0.02,1);
	sys.parameters({
		gravity : false
	});	
	sys.renderer = Renderer("#viewport");
	sys.screenPadding(100, 100, 100, 100);
	sys.rootId = getParameterByName("rootnode")?getParameterByName("rootnode"): defaultNode;
    
//	sys.rootId = "300000100087352";
	sys.pr = this;

	process(sys.rootId);
}