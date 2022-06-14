import os
import csv
import logging


class CSVHandler:
    def __init__(self):
        self.csv_object = []
        self.location_data_headers = {
            "metaInfo": [
                "locationName",
                "locationLat",
                "locationLng",
                "status",
                "requestTimestamp",
                "queryDate",
            ],
            "outputs": [
                "imageDate",
                "satelliteImageType",
                "satelliteImageFrequency",
                "cellConcentration",
                "maxCellConcentration",
                "latitude",
                "longitude",
                "validCellsCount",
            ],
        }
        self.user_headers = ["user_latitude", "user_longitude"]
        self.csv_headers = (
            self.user_headers
            + self.location_data_headers["metaInfo"]
            + self.location_data_headers["outputs"]
        )  # headers for output csv

    def create_csv(self, username, input_filename, locations_data):
        """
        Creates CSV from /locations/data response.
        """
        csv_data = []
        csv_data.append(self.csv_headers)
        for location in locations_data:
            csv_data += self.create_rows_for_location(location)

        # Save CSV data to file:
        self.save_csv_file(username, input_filename, csv_data)

        return csv_data

    def create_rows_for_location(self, location):
        """
        Creates row as a list for CSV.
        """
        row_data = []
        meta_info = []
        for header in self.user_headers:
            meta_info.append(location[header])
        for header in self.location_data_headers["metaInfo"]:
            meta_info.append(location["metaInfo"][header])
        row_data = self.add_location_data(
            location, header, meta_info
        )  # returns list of location rows
        return row_data

    def add_location_data(self, location, header, meta_info):
        """
        Creates rows for each data element in location "outputs" list.
        """
        location_rows = []
        if len(location.get("outputs", [])) < 1:
            location_rows.append(meta_info)
            return location_rows
        for data in location.get("outputs", []):
            row_data = list(meta_info)
            for header in self.location_data_headers["outputs"]:
                row_data.append(data[header])
            location_rows.append(row_data)
        return location_rows

    def save_csv_file(self, username, input_filename, csv_data):
        """
        Saves user csv to file.
        """
        output_filename = self.generate_output_filename(input_filename)
        full_filename = self.build_csv_file_path(output_filename)
        try:
            with open(full_filename, "w", newline="") as csv_file:
                writer = csv.writer(csv_file, delimiter=",")
                for row in csv_data:
                    writer.writerow(row)
            return output_filename
        except IOError as e:
            logging.warning(
                " utils.py save_csv_file error saving csv {}:\n {}".format(
                    input_filename, e
                )
            )
            return {"error": "error saving csv"}

    def build_csv_file_path(self, filename):
        """
        Builds absolute path of image filename.
        """
        cyan_flask_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return os.path.join(cyan_flask_dir, "user_jobs", filename)

    def generate_output_filename(self, input_filename):
        """
        Creates filename for user csv.
        """
        file_components = input_filename.split(
            ".csv"
        )  # gets filename without extension
        if len(file_components) < 2:
            logging.warning(
                "Batch input filename '{}' not of type .csv.".format(input_filename)
            )
            return False
        filename = file_components[0]
        return "{}_results.csv".format(filename)

    def remove_csv_file(self, input_filename):
        """
        Removes user results csv from disk.
        Determines filename from user's input csv file.
        """
        output_filename = self.generate_output_filename(input_filename)
        full_filename = self.build_csv_file_path(output_filename)
        if os.path.isfile(full_filename):
            logging.info("Removing file: {}".format(full_filename))
            os.remove(full_filename)
            logging.info("File removed.")
            return True
        else:
            logging.warning("File '{}' not found for removal.".format(full_filename))
            return False
