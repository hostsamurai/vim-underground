(function($, Sammy) {
    function processResponse(resp, context, ref) {
        context.pagination(ref, { nextKey: resp.key, nextKeyID: resp.id });
    }

    function processResults(resp, options) {
        var results = [],
            ref = options.reference,
            limit = options.limit;

        if (ref.nextIndex) {
            limit += ref.nextIndex - 1;
            results = resp.rows[0].value
                                  .slice(ref.nextIndex, limit);
        } else {
            for(var i=0; i<resp.rows.length; i+=1) {
               results.push(resp.rows[i].value);
            }
        }

       return { rows: results };
    }


    Sammy = Sammy || {};

    Sammy.Paginator = function(app, method_alias) {
        var paginator = function(fun, options) {
            var ctx = this;

            return this.send(fun, options)
                       .then(function(resp) {
                           var next;

                           if (resp.rows.length == options.limit) {
                               next = resp.rows.pop();
                           } else {
                               next = { key: null, id: null };
                           }

                           processResponse(next, ctx, options.reference);

                           return processResults(resp, options);
                       });
        }

        if (!method_alias) method_alias = "paginate";
        app.helper(method_alias, paginator);
    };

})(jQuery, window.Sammy);
