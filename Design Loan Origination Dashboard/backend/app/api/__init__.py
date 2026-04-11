from app.api.v1 import auth, health, predict


def register_blueprints(app):
    app.register_blueprint(auth.bp)
    app.register_blueprint(health.bp)
    app.register_blueprint(predict.bp)
