(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Project Widget",
                name: "metagenome_project",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("table") ];
    };
    
    widget.display = function (params) {
        widget = this;
	var index = widget.index;
	
	if (params && params.main) {
	    widget.main = params.main;
	    widget.sidebar = params.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;

	document.getElementById('icon_publications').lastChild.innerHTML = "Project";
	sidebar.parentNode.style.display = "none";
	content.className = "span10 offset1";

	// check if we have a project parameter
	if (Retina.cgiParam('project')) {
	    widget.id = Retina.cgiParam('project');
	    if (! widget.id.match(/^mgp/)) {
		widget.id = "mgp"+widget.id;
	    }
	}

	// if there is a project, show it
        if (widget.id) {
	    content.innerHTML = '<div style="margin-left: auto; margin-right: auto; margin-top: 300px; width: 50px;"><img style="" src="Retina/images/waiting.gif"></div>';

	    // check if required data is loaded
	    if (! ( stm.DataStore.hasOwnProperty('project') &&
	            stm.DataStore.project.hasOwnProperty(widget.id))) {
		jQuery.ajax({
		    dataType: "json",
		    headers: stm.authHeader, 
		    url: RetinaConfig.mgrast_api+'/project/'+widget.id+'?verbosity=summary',
		    success: function (data) {
			if (! stm.DataStore.hasOwnProperty('project')) {
			    stm.DataStore.project = {};
			}
			stm.DataStore.project[Retina.WidgetInstances.metagenome_project[1].id] = data;
			Retina.WidgetInstances.metagenome_project[1].display();
		    }}).fail(function(xhr, error) {
			content.innerHTML = "<div class='alert alert-danger' style='width: 500px;'>the project could not be loaded.</div>";
			console.log(error);
		    });
		return;
            }

	    var project = stm.DataStore.project[widget.id];
	    var id_no_prefix = widget.id.substr(3);
	    var html = "<h3>"+project.name+" ("+widget.id+")</h3>";
	    html += "<table>";
	    html += "<tr><td style='padding-right: 10px;'><b>principle investigator</b></td><td>"+project.pi+"</td></tr>";
	    html += "<tr><td><b>visibility</b></td><td>"+project.status+"</td></tr>";
	    html += "</table>";
	    html += "<h4>description</h4><p>"+project.description+"</p>";
	    html += "<h4>funding source</h4><p>"+project.funding_source+"</p>";
	    html += "<h4>contact</h4><address><strong>Administrative</strong><br>";
	    html += (project.metadata["PI_firstname"]||"-")+" "+(project.metadata["PI_lastname"]||"-")+" ("+(project.metadata["PI_email"]||"-")+")<br>"+(project.metadata["PI_organization"]||"-")+" ("+(project.metadata["PI_organization_url"]||"-")+")<br>";
	    html += (project.metadata["PI_organization_address"]||"-")+", "+(project.metadata["PI_organization_country"]||"-")+"</address>";
	    html += "<address><strong>Technical</strong><br>"+(project.metadata.firstname||"-")+" "+(project.metadata.lastname||"-")+" ("+(project.metadata.email||"-")+")<br>"+(project.metadata.organization||"-")+" ("+(project.metadata.organization_url||"-")+")<br>"+(project.metadata.organization_address||"-")+", "+(project.metadata.organization_country||"-")+"</address>";
	    html += "<h4>metagenomes</h4><div id='metagenome_table'><img src='Retina/images/waiting.gif' style='margin-left: 40%;margin-top: 100px;'></div>";
	    
	    content.innerHTML = html;

	    // create the metagenome table
	    var rows = [];
	    var url = RetinaConfig.mgrast_ftp+"/metagenome/";
	    for (var i=0; i<project.metagenomes.length; i++) {
		var mg = project.metagenomes[i];
		var row = [ "<a href='?mgpage=overview&metagenome="+mg.metagenome_id+"' target=_blank>"+mg.metagenome_id+"</a>",
			    "<a href='?mgpage=overview&metagenome="+mg.metagenome_id+"' target=_blank>"+mg.name+"</a>",
			    mg.basepairs,
			    mg.sequences,
			    mg.biome,
			    mg.feature,
			    mg.material,
			    mg.location,
			    mg.country,
			    mg.coordinates,
			    mg.sequence_type,
			    mg.sequencing_method,
			    '<button class="btn btn-mini" onclick="Retina.WidgetInstances.metagenome_project[1].authenticatedDownload(this, \''+mg.metagenome_id+'\', \'metadata\');"><i class="icon-download"></i> metadata</button><button class="btn btn-mini" onclick="Retina.WidgetInstances.metagenome_project[1].authenticatedDownload(this, \''+mg.metagenome_id+'\', \'submitted\');"><i class="icon-download"></i> submitted</button><button class="btn btn-mini" onclick="Retina.WidgetInstances.metagenome_project[1].authenticatedDownload(this, \''+mg.metagenome_id+'\', \'processed\');"><i class="icon-download"></i> results</button>'
			  ];
		rows.push(row);
	    }
	    Retina.Renderer.create("table", {
		target: document.getElementById('metagenome_table'),
		rows_per_page: 10,
		filter_autodetect: true,
		sort_autodetect: true,
		synchronous: true,
		sort: "name",
		invisible_columns: { 0: true },
		minwidths: [125,175,105,110,85,95,95,100,95,120,70,90,110],
		data: { data: rows, header: [ "MG-RAST ID", "name", "bp count", "seq. count", "biome", "feature", "material", "location", "country", "coordinates", "type", "method", "download" ] }
	    }).render();
        }
	// else show the project select
	else {
	    content.innerHTML = '<h3>select a project to view</h3><div id="project_table"></div>';

	    // create the job table
	    var columns = [ "name", "pi", "status" ];

	    var table_filter = { 0: { "type": "text" },
				 1: { "type": "text" },
				 2: { "type": "text" } };
	    if (! widget.hasOwnProperty('table')) {
		widget.table = Retina.Renderer.create("table", {
		    target: document.getElementById('project_table'),
		    rows_per_page: 20,
		    filter_autodetect: false,
		    filter: table_filter,
		    sort_autodetect: true,
		    synchronous: false,
		    sort: "name",
		    query_type: "equal",
		    default_sort: "name",
		    headers: stm.authHeader,
		    data_manipulation: Retina.WidgetInstances.metagenome_project[1].tableManipulation,
		    navigation_url: RetinaConfig['mgrast_api'] + "/project",
		    data: { data: [], header: columns }
		});
	    } else {
		widget.table.settings.target = document.getElementById('project_table');
	    }
	    widget.table.render();
	    widget.table.update({},1);
        }
	
    };

    widget.authenticatedDownload = function (button, id, type) {
	var widget = Retina.WidgetInstances.metagenome_project[1];
	button.setAttribute('disabled', 'true');
	var url = RetinaConfig.mgrast_api + "/";
	if (type == "metadata") {
	    url += "metagenome/"+id+"?verbosity=metadata";
	    jQuery.ajax( { url: url,
			   headers: stm.authHeader,
			   success: function(data) {
			       button.removeAttribute('disabled');
			       stm.saveAs(JSON.stringify(data, null, 2), id+"_metadata.json");
			   },
			   error: function () {
			       button.removeAttribute('disabled');
			       alert('download failed');
			   }
			 } );
	} else {
	    url += "download/"+id+"?file=";
	    if (type == "submitted") {
		url += "050.1";
	    } else {
		url += "700.1";
	    }
	    jQuery.ajax( { url: url+"&link=1",
			   headers: stm.authHeader,
			   success: function(data) {
			       button.removeAttribute('disabled');
			       window.location = data.url;
			   },
			   error: function () {
			       button.removeAttribute('disabled');
			       alert('download failed');
			   }
			 } );
	}
    };

    widget.tableManipulation = function (data) {
	for (var i=0; i<data.length; i++) {
	    data[i].name = "<a href='?mgpage=project&project="+data[i].id+"'>"+data[i].name+"</a>";
	}
	return data;
    };

})();