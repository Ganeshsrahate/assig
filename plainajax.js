//	PlainAjax engine: http://coolpenguin.net/plainajax

function PlainAjax() {

    this.timeout=300000;
	
	this.requests = new Array();
    this.reqnextid = 0;
    this.semafor = true;
	
    this.autoresends = new Array();
	this.refnextid = 0;
	
    this.ParamContainer = function() {
        
        this.paramsarr = new Array();
        this.paramstring = '';
        this.acceptedparams = new Array("respurl", "resultloc", "paramloc", "autoresend", "conftext", "loadmsg", "loadmsgloc");
        
        this.Param = function(name, value) {
            this.name = name;
            this.value = value;   
        }
            
        this.processParamString = function(paramstring) {
        
            this.paramsarr = new Array();
            var parsrawarr = paramstring.split(';');
            for(rawindex=0; rawindex<parsrawarr.length; ++rawindex) {
                parrawstring = parsrawarr[rawindex];
                var parrawarr = parrawstring.split(':');
                if(parrawarr.length == 2) {
                    var name = this.trimText(parrawarr[0]);
                    var value = this.trimText(parrawarr[1]);
                    if(name!='') {
                        var param = new this.Param(name, value); 
                        for(pnameindex = 0; pnameindex<this.acceptedparams.length; ++pnameindex) {
                            accparam = this.acceptedparams[pnameindex];             
                            if(param.name == accparam)
                               this.paramsarr.push(param);
                        }  
                    }
                }
            }
        }
            
        this.get = function(name) {
            for(paramindex = 0; paramindex<this.paramsarr.length; ++paramindex) {
                param = this.paramsarr[paramindex];
                if(param.name == name)
                    return param.value;
            }
            return null;
        }
        
        this.set = function(name, value) {
            for(paramindex = 0; paramindex<this.paramsarr.length; ++paramindex) {
                param = this.paramsarr[paramindex];
                if(param.name == name)
                    this.paramsarr[paramindex].value = value;
            }
        }
        
        this.trimText = function(text) {
            while (text.substring(0,1) == ' ')
                text = text.substring(1, text.length);
            while (text.substring(text.length-1, text.length) == ' ')
                text = text.substring(0,text.length-1); 
            return text;
        }
        
        this.getParamString = function() {
            var paramstring = '';
            for(paramindex = 0; paramindex<this.paramsarr.length; ++paramindex) {
                    param = this.paramsarr[paramindex];
                    if(param.value != null)
                        paramstring += param.name + ": " + param.value + "; ";
            }
            return paramstring;
        }
        
    }
	
    this.request = function(paramstring, resultfunc) {
        this.cleanUpRequests();
        
        var params = new this.ParamContainer();
        params.processParamString(paramstring);
        if(params.get('conftext') == null || confirm(params.get('conftext'))) {
            this.semaforStart();
            var request = new this.PlainAjaxRequest(this.reqnextid, params, resultfunc);
            this.requests.push(request);
            ++this.reqnextid;
            this.semaforEnd();
            request.doRequest();
            
            if(params.get('autoresend')!=null) {
                this.semaforStart();
                var autoresend = new this.AutoResend(this.refnextid, params, resultfunc);
                this.autoresends.push(autoresend);
                ++this.refnextid;
                this.semaforEnd();
                autoresend.beginref();
            }
		}
    }

    this.cleanUpRequests = function() {
        this.semaforStart();
        for(i=0; i<this.requests.length; ++i) {
            current = new Date().getTime();
            if(current-this.requests[i].timestamp>this.timeout)
                this.requests.splice(i, 1);
		}
		this.semaforEnd();
    }
        
    this.getRequest = function(id) {
        this.semaforStart();
        request = this.requests[this.getPos(id)];
        this.semaforEnd();
        return request;
    }
    
    this.delRequest = function(id) {
        this.semaforStart();
        this.requests.splice(this.getPos(id), 1);
        this.semaforEnd();
    }
    
    this.getPos = function(id) {
        for(i=0; i<this.requests.length; ++i) 
            if(this.requests[i].id == id)
                return i;
        throw "Request not found";
    }
    
    this.semaforStart = function() {
        while(this.semafor == false)
            this.pause(1);
        this.semafor = false;
     }   
        
    
    this.semaforEnd = function() {
        this.semafor = true;
    }
    
    this.pause = function(milli) {
        var date = new Date();
		var curDate = null;
        do { 
            curDate = new Date();
        }
        while(curDate-date < milli);
    }
	
	this.PlainAjaxRequest = function(id, params, resultfunc) {	
	
        this.id = id;
        this.params = params;
        this.resultfunc = resultfunc;
        
        this.timestamp = new Date().getTime();
        this.xmlhttp;
	
        this.doRequest = function() {
            var url = this.getUrl();
            var querystring = this.getQueryString();
            var actionfunction = this.getActionFunction();
            this.xmlhttp = this.getXmlHttp(url, querystring, actionfunction);
            if((this.params.get('loadmsg') != null)) {
                var loadmsgloc = this.params.get('loadmsgloc');
                var target = loadmsgloc == null ? this.params.get('resultloc') : loadmsgloc;
                var targetElement = document.getElementById(target);
                if(targetElement == null)
                	alert('Warning: target HTML element not found: ' + target);
				if(targetElement.tagName=='TEXTAREA') 
					targetElement.value = this.params.get('loadmsg');
				else
					targetElement.innerHTML = this.params.get('loadmsg');
            }
            this.xmlhttp.send(querystring);
        }
        


        
        this.getActionFunction = function() {
            var actionstring = "";
            actionstring += "request = plainajax.getRequest("+this.id+");\nif(request.xmlhttp.readyState == 4 && request.xmlhttp.status == 200)\n{\n";
            if(this.params.get('resultloc'))
                actionstring += "if(document.getElementById(\"" + this.params.get('resultloc') + "\").tagName=='TEXTAREA')\ndocument.getElementById(\"" + this.params.get('resultloc')+"\").value = request.xmlhttp.responseText;\nelse\ndocument.getElementById(\""+this.params.get('resultloc')+"\").innerHTML = request.xmlhttp.responseText;\n";
            if(this.resultfunc != undefined && this.resultfunc != null)
                actionstring += "request.resultfunc(request.xmlhttp.responseText);\n"; 
            actionstring += "plainajax.delRequest("+this.id+");\n}";            
            var actionfunction = new Function(actionstring);
            return actionfunction;
        }
	
        this.getUrl = function() {
            connectchar = this.params.get('respurl').indexOf('?') != -1 ? '&' : '?';
            var url = this.params.get('respurl') + connectchar + "timeStamp=" + this.timestamp;
            return url;
        }
	
		this.getFields = function() {
            pdiv = document.getElementById(this.params.get('paramloc'));
            var fieldtypes = new Array("input", "textarea", "select");
            fields = new Array();
            for(typeid = 0; typeid<fieldtypes.length; ++typeid) {
                fieldtype = fieldtypes[typeid];
				nodes = pdiv.getElementsByTagName(fieldtype);
				for(nodeid=0; nodeid<nodes.length; ++nodeid) {
					node = nodes[nodeid];
					if((fieldtype != "input" || (fieldtype == "input" && node.type!="button" && node.type!="file") && ((node.type!="checkbox" && node.type!="radio") || (node.checked))) && ((fieldtype == "input" || fieldtype == "textarea" || fieldtype == "select") && !node.disabled))
						fields.push(node);
				}
			}
            return fields;
        }
	
        this.getQueryString = function() {
            querystring = '';
            if(this.params.get('paramloc') != null) {
                var fields = this.getFields();
                for(i=0; i<fields.length; ++i) {
                    var node = fields[i];
                    if(node.name != "" && node.type != "file")
                        querystring += '&' + node.name + '=' + escape(node.value);
                }
            }
            return querystring;
        }
	
        this.getXmlHttp = function(url, querystring, actionfunction) {
            var xmlhttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("MSXML2.XMLHTTP.3.0");
            method = (this.params.get('paramloc') == null) ? "GET" : "POST";
            xmlhttp.open(method, url, true);
            xmlhttp.onreadystatechange = actionfunction; 
            xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xmlhttp.setRequestHeader("Connection", "close");
            xmlhttp.setRequestHeader("Content-length", querystring.length);
            return xmlhttp;
        }
    }
	
	this.AutoResend = function(id, params, resultfunc) {
	
		this.timer = null;
		this.autoresend;
		
		this.id = id;
		this.params = params;
		this.resultfunc = resultfunc;
		
		this.beginref = function() {
            this.autoresend = this.params.get('autoresend'); 
			this.params.set('autoresend', null);
			setInterval("autoresend = plainajax.autoresends["+this.id+"]; plainajax.request( autoresend.params.getParamString(), autoresend.resultfunc);", this.autoresend);
		}
	}
}

var plainajax = new PlainAjax();