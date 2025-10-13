from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, IntegerField, SubmitField
from wtforms.validators import DataRequired, NumberRange

class MovieForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    genre = SelectField('Genre', choices=[
        ('Action', 'Action'),
        ('Drama', 'Drama'),
        ('Comedy', 'Comedy'),
        ('Horror', 'Horror'),
        ('Sci-Fi', 'Sci-Fi')
    ])
    duration = IntegerField('Duration (minutes)', validators=[DataRequired(), NumberRange(min=1)])
    submit = SubmitField('Save')
