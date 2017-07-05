// call "nbdime" and compare current version with new version in new tab

define([
    'base/js/namespace',
    'jquery',
    'base/js/utils'
], function(Jupyter, $, utils) {
    "use strict";

    // Custom util functions:
    var reStripLeading = /^\/+/
    var stripLeft = function (string) {
        return string.replace(reStripLeading, '');
    };

    var path_join = function () {
        return stripLeft(utils.url_path_join.apply(this, arguments));
    }

    /**
     * Call nbdime difftool with given base and remote files
     */
    var nbDiffView = function (tool, base, remote) {
        var base_url = Jupyter.notebook.base_url;
        var url = window.location.origin + '/' + path_join(base_url, 'nbdime', tool) +
            '?base=' + base;
        if (remote) {
            url += '&remote=' + remote;
        }

        window.open(url);
        $('#doCheckpointDiffView').blur();
    };

    /**
     * Call nbdime difftool with current notebook against checkpointed version
     */
    var nbCheckpointDiffView = function () {
        var nb_dir = utils.url_path_split(Jupyter.notebook.notebook_path)[0];
        var name = Jupyter.notebook.notebook_name;
        var base = path_join(nb_dir, '.ipynb_checkpoints', utils.splitext(name)[0] + '-checkpoint.ipynb');
        var remote = path_join(nb_dir, name);

        nbDiffView('difftool', base, remote);
    };

    /**
     * Call nbdime difftool with current notebook against checkpointed version
     */
    var nbGitDiffView = function () {
        var nb_dir = utils.url_path_split(Jupyter.notebook.notebook_path)[0];
        var name = Jupyter.notebook.notebook_name;
        var base = path_join(nb_dir, name);

        // Empty file name triggers git, given that it is available on server path
        nbDiffView('git-difftool', base, '');
    };

    var isGit = function (path) {
        var url = window.location.origin + '/' + path_join(Jupyter.notebook.base_url, 'nbdime', 'api', 'isgit');
        var request = {
            data: JSON.stringify({ 'path': Jupyter.notebook.notebook_path }),
            method: 'POST',
        };
        return utils.promising_ajax(url, request);
    };

    var register = function (isGit) {
        var prefix = 'nbdime';

        // Register checkpoint action
        var checkpointAction = Jupyter.actions.register({
            icon: 'fa-clock-o',
            help: 'Display nbdiff from checkpoint to currently saved version',
            handler : nbCheckpointDiffView
        }, 'diff-notebook-checkpoint', prefix);

        if (isGit) {
            // Register git action
            var gitAction = Jupyter.actions.register({
                icon: 'fa-git',
                help: 'Display nbdiff from git HEAD to currently saved version',
                handler : nbGitDiffView
            }, 'diff-notebook-git', prefix);

            // Add both buttons, with label on git button
            var btn_group = Jupyter.toolbar.add_buttons_group([
                checkpointAction,
            {
                action: gitAction,
                label: 'nbdiff',
            }]);

            // Tooltip for git button:
            btn_group.children(':last-child').attr('title', Jupyter.actions.get(gitAction).help);
        } else {
            // Add only checkpoint button, with label on it
            var btn_group = Jupyter.toolbar.add_buttons_group([{
                action: checkpointAction,
                label: 'nbdiff',
            }]);
        }

        // Tooltip for checkpoint button:
        btn_group.children(':first-child').attr('title', Jupyter.actions.get(checkpointAction).help);
    };

    var load_ipython_extension = function() {

        var promise = isGit(Jupyter.notebook.path);
        promise.then((data) => {
            var isGit = data['is_git'];
            register(isGit);
        }, (error) => {
            // Assume that we don't have git
            register(false);
        });
    };

    return {
        load_ipython_extension : load_ipython_extension
    };
});
