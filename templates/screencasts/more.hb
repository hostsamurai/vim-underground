{{#rows}}
    <li class="h-sc-snippet">
        <div class="sc-info-wrapper">
	    <div class="time-wrapper">
		<time datetime="{{posted_on}}" class="fancy-time"></time>
	    </div>

            <a href="{{link}}"><img src="{{thumb_url}}" class="preview" width="90" height="90" /></a>

            <a class="header-link" href="{{link}}"><h3>{{title}}</h3></a>
        </div>

        <div class="desc-wrapper">
	    <p class="summary">{{summary}}</p>
		    
	    <div class="more">
		<a href="{{link}}">Read More&hellip;</a>
	    </div>
        </div>
    </li>
{{/rows}}
