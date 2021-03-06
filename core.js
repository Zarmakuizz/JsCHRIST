function JsCHRIST()
{
	this.data = {};
};

JsCHRIST.prototype =
{
	onready: function()
	{
		$('#closeFullscreenButton').hide();
		var elem = window.document.documentElement;
		if (!elem.requestFullScreen && !elem.mozRequestFullScreen && !elem.webkitRequestFullScreen)
			$('#openFullscreenButton').hide();


		$('#openFullscreenButton').click(function() {
			if (elem.requestFullScreen) {  
				  elem.requestFullScreen();  
			} else if (elem.mozRequestFullScreen) {  
				  elem.mozRequestFullScreen();  
			} else if (elem.webkitRequestFullScreen) {  
				  elem.webkitRequestFullScreen();  
			}
			$('#openFullscreenButton').hide();
			$('#closeFullscreenButton').show();
			return false;
		});

		$('#closeFullscreenButton').click(function() {
			if (document.cancelFullScreen) {  
				  document.cancelFullScreen();  
			} else if (document.mozCancelFullScreen) {  
				  document.mozCancelFullScreen();  
			} else if (document.webkitCancelFullScreen) {  
				  document.webkitCancelFullScreen();  
			}
			$('#closeFullscreenButton').hide();
			$('#openFullscreenButton').show();
			return false;
		});

		var obj = this;
		var clic_releve = function(canard) {
			var nom = canard.srcElement ? canard.srcElement.firstChild.data : canard.target.firstChild.data;
			$('#reportList li').removeClass('selected');
			$(canard.srcElement).addClass('selected');

			$.ajax({
				url: "../app/RestJson/data_dt/"+encodeURIComponent(nom),
				success: function(json) {
					var start_t = Date.parse(json.start_t);
					var date = new Date(start_t);
					var data  = {
						timeMin: date,
						timeMax: date,
						dataMin: json.data[0].rythme,
						dataMax: json.data[0].rythme,
						data: []
					};

					obj.data[nom] = data;

					$(obj).trigger("jschrist.add_statement", {name: nom});
				
					var start_t = Date.parse(json.start_t);

					var i = 0;
					
					var _addTuple = function(i)
					{
						start_t += json.data[i].dt;
						var tuple = {time_t: new Date(start_t), data: json.data[i].rythme};
						obj.addTuple(data, tuple);
						return tuple;
					}

					for (; i < 30; ++i)
						_addTuple(i);

					$(obj).trigger("jschrist.new_tuples", {
						statement_name: nom,
						data: data.data
					});

					var intervale = window.setInterval(function(){

						$(obj).trigger("jschrist.new_tuples", {
							statement_name: nom,
							data: [_addTuple(i)]
						});

						if (++i == json.data.length)
							window.clearInterval(intervale);

					}, 42);

				},
				error: function() {
					alert("oops");
				}});
		};

		$.ajax({
			url: "../app/RestJson/reports",
			success: function(json) {
				var list = $('#reportList ul');
				list.empty();
				for (var report in json)
				{
					var li = newDom('li');
					li.appendChild(document.createTextNode(report));
					li.onclick = clic_releve;
					list.append(li);
				}
			},
			error: function(e) {
				alert(e.status == 401 ? "Vous devez vous connecter." : e.statusText);
			}});

	},


	addTuple: function(data, tuple)
	{
		if (tuple.time_t < data.timeMin) data.timeMin = tuple.time_t;
		if (tuple.time_t > data.timeMax) data.timeMax = tuple.time_t;
		if (tuple.data < data.dataMin) data.dataMin = tuple.data;
		if (tuple.data > data.dataMax) data.dataMax = tuple.data;

		data.data.push(tuple);
	}
};
