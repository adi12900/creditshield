from flask import jsonify
from marshmallow import ValidationError


def register_error_handlers(app):
    @app.errorhandler(ValidationError)
    def validation_error(err):
        return jsonify({"error": "validation_error", "messages": err.messages}), 422

    @app.errorhandler(400)
    def bad_request(err):
        return jsonify({"error": "bad_request", "message": str(err.description)}), 400

    @app.errorhandler(401)
    def unauthorized(err):
        return jsonify({"error": "unauthorized", "message": str(err.description)}), 401

    @app.errorhandler(403)
    def forbidden(err):
        return jsonify({"error": "forbidden", "message": str(err.description)}), 403

    @app.errorhandler(404)
    def not_found(err):
        return jsonify({"error": "not_found", "message": str(err.description)}), 404

    @app.errorhandler(422)
    def unprocessable(err):
        return jsonify({"error": "validation_error", "message": str(err.description)}), 422

    @app.errorhandler(500)
    def internal_error(err):
        return jsonify({"error": "internal_error", "message": "An unexpected error occurred."}), 500
