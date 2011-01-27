{{#rows}}
    <li class="h-article-snippet">
        <div class="article-info-wrapper">
	    <div class="time-wrapper">
		<time datetime="{{posted_on}}" class="fancy-time"> </time>
	    </div>

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
