import base64
from io import BytesIO
import matplotlib.pyplot as plt


def save_plot(filename):
    """
    Save the current matplotlib figure and return it as a base64 encoded string.
    This allows the image to be sent directly in the API response.
    """
    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    buffer.close()
    plt.close()
    
    return f"data:image/png;base64,{image_base64}"
