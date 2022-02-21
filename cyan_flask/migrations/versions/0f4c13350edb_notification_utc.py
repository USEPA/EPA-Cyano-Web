"""notification_utc

Revision ID: 0f4c13350edb
Revises: 5380c68c4c1f
Create Date: 2020-10-06 09:57:09.844269

"""
from alembic import op
import sqlalchemy as sa

from cyan_flask.app.models import Notifications, db
from cyan_flask.app import utils


# revision identifiers, used by Alembic.
revision = "0f4c13350edb"
down_revision = "5380c68c4c1f"
branch_labels = None
depends_on = None


def upgrade():
    notifications = Notifications.query.all()
    for notification in notifications:
        # 1. Gets current date timestamp that's in EDT (example: 2020-10-04 11:12:14 EDT)
        current_date_edt = notification.date.strftime("%Y-%m-%d %H:%M:%S")
        print("Current date in EDT: {}".format(current_date_edt))

        # 2. Converts timestamp to unix time
        unix_time = utils.convert_to_unix(current_date_edt)
        print("Unix time (EDT): {}".format(unix_time))

        # 3. Converts unix time from EDT to UTC
        utc_unix_time = int(
            str(unix_time + 14400) + "000"
        )  # NOTE: "000" padding due to notifications endpoint having 3 trailing 0's (see utils.convert_to_timestamp)
        print("Curated UTC unix time: {}".format(utc_unix_time))

        # 4. Converts UTC unix time to UTC timestamp
        utc_timestamp = utils.convert_to_timestamp(utc_unix_time)
        print("UTC timestamp: {}".format(utc_timestamp))

        # 5. Updates notification date in DB
        notification.date = utc_timestamp
        db.session.commit()

    db.session.close()


def downgrade():
    notifications = Notifications.query.all()
    for notification in notifications:
        # 1. Gets current date timestamp that's in EDT (example: 2020-10-04 11:12:14 EDT)
        current_date_utc = notification.date.strftime("%Y-%m-%d %H:%M:%S")
        print("Current date in UTC: {}".format(current_date_utc))

        # 2. Converts timestamp to unix time
        unix_time = utils.convert_to_unix(current_date_utc)
        print("Unix time (UTC): {}".format(unix_time))

        # 3. Converts unix time from UTC to EDT
        edt_unix_time = int(
            str(unix_time - 14400) + "000"
        )  # NOTE: "000" padding due to notifications endpoint having 3 trailing 0's (see utils.convert_to_timestamp)
        print("Curated EDT unix time: {}".format(edt_unix_time))

        # 4. Converts EDT unix time to EDT timestamp
        edt_timestamp = utils.convert_to_timestamp(edt_unix_time)
        print("EDT timestamp: {}".format(edt_timestamp))

        # 5. Updates notification date in DB
        notification.date = edt_timestamp
        db.session.commit()

    db.session.close()
