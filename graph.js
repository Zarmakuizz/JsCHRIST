JsCHRIST_Graph = function(core, screen)
{
	// Représente l'instance des données à traiter
	this.core = core;

	// Zonede travail du graphique
	this.screen = screen;

	// Objet Canvas représentant les courbes
	this.screenGraph = newDom('canvas');
	this.screenGraph.id = "screenGraph";
	this.screen.appendChild(this.screenGraph);
	this.canvasGraph = this.screenGraph.getContext('2d');

	// Objet Canvas représentant la ligne de sélection
	this.screenLine = newDom('canvas');
	this.screenLine.id = "screenLine";
	this.screen.appendChild(this.screenLine);
	this.canvasLine = this.screenLine.getContext('2d');
	
	// Dernières positions des points tracés
	this.x_i = {};
	this.y_i = {};
	
	// Coefficients pour l'echelle
	this.coef_x = undefined;
	this.coef_y = undefined;
	
	// Position de la souris
	this.mousePos = 0;
	this.paintedMousePose = -1;

	// Gestion de la taille de la zone
	this.manageSize();
	$(window).resize(this, this.manageSize);

	// Gestion simple de la synchronisation du temps
	var obj = this;
	$(this.screen).mousemove(function(e) {
		obj.mousePos = e.offsetX;
		obj.paintLine();

		$(obj.core).trigger("jschrist.time_sync", {time_t: obj.mousePos});
	});

	//$(core).bind("jschrist.add_statement", function(a, b) { log(b);});
	$(core).bind("jschrist.new_tuples", function(a, b)
	{
		obj.paintGraph(false, b.statement_name, b.data);
	});

}

JsCHRIST_Graph.prototype =
{
	// Gestion de la taille du graphe
	manageSize: function(obj)
	{
		var obj = obj == null ? this : obj.data;
		obj.width = $(obj.screen).width();
		obj.height = $(obj.screen).height();
		
		obj.screenGraph.width = obj.width;
		obj.screenGraph.height = obj.height;
		obj.screenLine.width = obj.width;
		obj.screenLine.height = obj.height;
		
		//obj.paintGraph(true);
	},

	// Afficher la ligne de sélection
	paintLine: function()
	{
		var c = this.canvasLine;

		// Masquage de l'ancien emplacement
		if (this.paintedMousePose >= 0)
			c.clearRect(this.paintedMousePose - 5,0, 10, this.height);

		c.beginPath();
		c.strokeStyle = "white";
		c.lineWidth = 2;
		c.moveTo(this.mousePos, 0);
		c.lineTo(this.mousePos, this.height);
		c.stroke();
		c.closePath();

		this.paintedMousePose = this.mousePos;
	},
	
	setLadderCoeff: function(key)
	{
		//calcul des coefficients à affecter aux valeurs pour faire correspondre pixels et valeur.
		//coeffiecients permettant de représenter les données proportionnellement à la fenetre d'affichage.
		if(this.core.data[key].timeMax != this.core.data[key]) 
			this.coef_x = this.width / (this.core.data[key].timeMax - this.core.data[key].timeMin);
			
		if(this.core.data[key].dataMax != this.core.data[key].dataMin) 
			this.coef_y = this.height / (this.core.data[key].dataMax - this.core.data[key].dataMin);
	},
	
	paintGraph: function(fullPaint, key, data)
	{
		var colors = ['blue', 'purple', 'red', 'yellowgreen'];
		
		var c = this.canvasGraph;
		
		// Récupération des valeurs (performances)
		var x_i = this.x_i[key];
		var y_i = this.y_i[key];

		var coef_x = this.coef_x;
		var coef_y = this.coef_y;

		this.setLadderCoeff(key);

		// Si l'on ne passe pas les données ou que l'échelle a changée, il faut
		// tout redessiner
		if (data == undefined || this.coef_y != coef_y)
		{
			fullPaint = true;
			coef_x = this.coef_x;
			coef_y = this.coef_y;
		}
		else // Sinon, on garde l'ancienne échelle
		{
			this.coef_x = coef_x;
			this.coef_y = coef_y;
		}


		if (fullPaint)
		{
			// Si on dessine tout, il faut récupérer toutes les données
			data = this.core.data[key].data;

			// On efface toute l'ancienne zone
			c.clearRect(0,0, this.width, this.height);
			x_i = 0;
			y_i = this.height - ((data[0].data - this.core.data[key].dataMin) * coef_y);
		}
		
		c.beginPath();
		c.strokeStyle = colors.pop();
		c.lineWidth = 2;
		/*c.shadowBlur = 3;
		c.shadowColor = "black";
		c.shadowOffsetX = 1;
		c.shadowOffsetY = 1;*/

		c.moveTo(x_i,y_i);

		// Pour chaque point à afficher
		for (var i = 0; i < data.length; ++i)
		{

			var tmp_x = (Date.parse(data[i].time_t) - Date.parse(this.core.data[key].timeMin))* coef_x;
			// Si la position dépasse, il faut tout décaler
			if (tmp_x > this.width)
			{	
				var incr = tmp_x - x_i;
				this.decalerGraph(incr);
				x_i = tmp_x;
				c.moveTo(this.width - incr,y_i);
				tmp_x = this.width;
			}
			else
			{
				x_i = tmp_x;
			}
			
			y_i = this.height - ((data[i].data - this.core.data[key].dataMin) * coef_y);
			c.lineTo(tmp_x, y_i);
		}

		c.stroke();
		c.closePath();

		fullPaint = false;
		
		this.x_i[key] = x_i;
		this.y_i[key] = y_i;
	},

	// Décalage du graphe en prenant les pixels du canvas
	decalerGraph: function(decalage)
	{
		var c = this.canvasGraph;
		var imgData = c.getImageData(0,0,this.width, this.height);

		c.clearRect(this.width-decalage,0, decalage, this.height);
		c.putImageData(imgData, -decalage, 0);
	}
}
